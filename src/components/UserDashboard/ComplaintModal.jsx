import React, { useEffect, useMemo, useState } from 'react';
import { useToast } from '../../ui/DialogProvider.jsx';
import StorefrontIcon from '../../ui/StorefrontIcon.jsx';
import { userFetch } from '../../utils/api.js';

const CATEGORIES = [
  { key: 'shop', label: 'A Shop',   icon: <StorefrontIcon size={22} color="#16a34a" />, help: 'Behaviour, packing, missing items, etc.' },
  { key: 'item', label: 'An Item',  icon: '🛒', help: 'Damaged, expired, wrong product.' },
  { key: 'app',  label: 'The App',  icon: '📱', help: 'Bugs, feature requests, anything else.' },
];

export default function ComplaintModal({ open, onClose, user }) {
  const toast = useToast();

  const [category, setCategory] = useState('shop');
  const [shopId, setShopId] = useState('');
  const [itemName, setItemName] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orderedShops, setOrderedShops] = useState([]);
  const [orderedItems, setOrderedItems] = useState([]);

  // Reset form whenever the modal reopens — stale state from a previous session
  // shouldn't leak into a new complaint.
  useEffect(() => {
    if (open) {
      setCategory('shop');
      setShopId('');
      setItemName('');
      setMessage('');
      setSubmitting(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Pull the user's order history once so the shop/item pickers can show only
  // places they've actually ordered from.
  useEffect(() => {
    if (!open || !user?._id) return;
    let cancelled = false;
    userFetch(user, `/orders/user/${user._id}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (cancelled) return;
        const orders = Array.isArray(data) ? data : [];
        const shopMap = new Map();
        const items = new Set();
        orders.forEach(o => {
          if (o.shopId && typeof o.shopId === 'object' && o.shopId._id) {
            shopMap.set(o.shopId._id, o.shopId.name || 'Shop');
          }
          (o.items || []).forEach(it => { if (it?.name) items.add(it.name); });
        });
        setOrderedShops(Array.from(shopMap.entries()).map(([id, name]) => ({ id, name })));
        setOrderedItems(Array.from(items));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [open, user?._id]);

  const canSubmit = useMemo(() => {
    if (submitting) return false;
    if (!message.trim()) return false;
    if (category === 'shop' && !shopId) return false;
    return true;
  }, [submitting, message, category, shopId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      // userId/userName/userPhone come from the bearer session server-side now —
      // don't send them in the body (they're ignored anyway, but no need to
      // leak phone numbers over the wire that the server already knows).
      const body = {
        targetType: category,
        shopId: category === 'shop' ? shopId : (category === 'item' && shopId) ? shopId : null,
        itemName: category === 'item' ? itemName.trim() : '',
        message: message.trim(),
      };
      const res = await userFetch(user, `/complaints`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed');
      toast('Complaint submitted — we’ll look into it.');
      onClose();
    } catch (err) {
      toast('Could not submit. Try again in a moment.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        zIndex: 1000, animation: 'cmFade 0.18s ease-out',
      }}
    >
      <style>{`
        @keyframes cmFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes cmSlide { from { transform: translateY(20px); opacity: 0.6; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        style={{
          width: '100%', maxWidth: '640px', maxHeight: '92vh',
          background: '#fff', borderTopLeftRadius: '22px', borderTopRightRadius: '22px',
          display: 'flex', flexDirection: 'column',
          animation: 'cmSlide 0.22s ease-out',
        }}
      >
        {/* Header */}
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Support</div>
            <h2 style={{ margin: '2px 0 0', color: '#0f172a', fontSize: '1.2rem', fontWeight: 900 }}>File a Complaint</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{ background: '#f1f5f9', border: 'none', width: '34px', height: '34px', borderRadius: '999px', cursor: 'pointer', fontSize: '1rem', fontWeight: 800, color: '#475569' }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', padding: '16px 20px 8px' }}>

          {/* Category */}
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '10px' }}>
            What is this about?
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '18px' }}>
            {CATEGORIES.map(c => {
              const active = category === c.key;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCategory(c.key)}
                  style={{
                    padding: '14px 8px',
                    background: active ? '#f0fdf4' : '#fff',
                    border: active ? '2px solid #16a34a' : '1px solid #e2e8f0',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                    boxShadow: active ? '0 6px 16px rgba(22,163,74,0.15)' : 'none',
                  }}
                >
                  <span style={{ fontSize: '1.4rem', lineHeight: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: '28px' }}>{c.icon}</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: active ? 900 : 700, color: '#0f172a' }}>{c.label}</span>
                </button>
              );
            })}
          </div>

          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, marginTop: '-10px', marginBottom: '16px' }}>
            {CATEGORIES.find(c => c.key === category)?.help}
          </div>

          {/* Shop picker — required for shop, optional for item */}
          {(category === 'shop' || category === 'item') && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#0f172a', fontWeight: 800, marginBottom: '6px' }}>
                Which shop? {category === 'shop' && <span style={{ color: '#ef4444' }}>*</span>}
              </label>
              {orderedShops.length > 0 ? (
                <select
                  value={shopId}
                  onChange={(e) => setShopId(e.target.value)}
                  required={category === 'shop'}
                  style={{
                    width: '100%', padding: '12px 14px',
                    borderRadius: '12px', border: '1px solid #cbd5e1',
                    fontSize: '0.95rem', fontWeight: 600, color: '#0f172a',
                    background: '#fff', outline: 'none',
                  }}
                >
                  <option value="">— select a shop you ordered from —</option>
                  {orderedShops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              ) : (
                <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: '12px', color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>
                  You haven’t ordered from any shop yet — describe the issue in the message below.
                </div>
              )}
            </div>
          )}

          {/* Item name — only for item */}
          {category === 'item' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#0f172a', fontWeight: 800, marginBottom: '6px' }}>
                Which item? <span style={{ color: '#94a3b8', fontWeight: 600 }}>(optional)</span>
              </label>
              <input
                list="complaint-item-list"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g. Amul Gold 1L"
                style={{
                  width: '100%', padding: '12px 14px',
                  borderRadius: '12px', border: '1px solid #cbd5e1',
                  fontSize: '0.95rem', fontWeight: 600, color: '#0f172a',
                  background: '#fff', outline: 'none',
                }}
              />
              <datalist id="complaint-item-list">
                {orderedItems.map((n, i) => <option key={i} value={n} />)}
              </datalist>
            </div>
          )}

          {/* Message */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#0f172a', fontWeight: 800, marginBottom: '6px' }}>
              Describe the issue <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={5}
              placeholder="Tell us what happened. The more detail, the faster we can help."
              maxLength={1000}
              style={{
                width: '100%', padding: '12px 14px',
                borderRadius: '12px', border: '1px solid #cbd5e1',
                fontSize: '0.95rem', fontWeight: 500, color: '#0f172a',
                background: '#fff', outline: 'none', resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
            <div style={{ textAlign: 'right', fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, marginTop: '4px' }}>
              {message.length}/1000
            </div>
          </div>

          <div style={{ padding: '10px 12px', background: '#fefce8', border: '1px solid #fde68a', borderRadius: '10px', color: '#854d0e', fontSize: '0.78rem', fontWeight: 600, marginBottom: '8px' }}>
            Our team reviews every complaint. Shop-related complaints are also sent to the shop owner.
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{ flex: '0 0 auto', padding: '14px 18px', background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '12px', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              flex: 1, padding: '14px', border: 'none', borderRadius: '12px',
              background: canSubmit ? '#16a34a' : '#cbd5e1',
              color: '#fff', fontWeight: 900, fontSize: '1rem',
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              boxShadow: canSubmit ? '0 8px 22px rgba(22,163,74,0.28)' : 'none',
            }}
          >
            {submitting ? 'Submitting…' : 'Submit Complaint'}
          </button>
        </div>
      </form>
    </div>
  );
}

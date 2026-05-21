import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useToast } from '../../ui/DialogProvider.jsx';
import { shopFetch } from '../../utils/api.js';

// Shop self-service profile editor. Covers the fields exposed by the
// SHOP_SELF_WRITABLE whitelist on the server (name, ownerName, address,
// hours, UPI ID, FSSAI/GST/PAN). UPI ID is mandatory for parchi billing
// — without it /parchis/:id/send-bill returns 400.
export default function ShopProfileModal({ open, shop, onClose, onShopUpdated }) {
  const toast = useToast();
  const [form, setForm] = useState({
    name: '', ownerName: '', fullAddress: '', operatingHours: '',
    upiId: '', fssai: '', gst: '', panNumber: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !shop) return;
    setForm({
      name: shop.name || '',
      ownerName: shop.ownerName || '',
      fullAddress: shop.fullAddress || '',
      operatingHours: shop.operatingHours || '09:00 AM - 10:00 PM',
      upiId: shop.upiId || '',
      fssai: shop.fssai || '',
      gst: shop.gst || '',
      panNumber: shop.panNumber || '',
    });
  }, [open, shop]);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    if (form.upiId && !form.upiId.includes('@')) {
      toast('UPI ID should look like name@bank (e.g. shopname@oksbi)', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await shopFetch(shop, `/shops/${shop._id}`, {
        method: 'PATCH',
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast(err.error || 'Could not update profile', 'error');
        return;
      }
      const updated = await res.json();
      if (onShopUpdated) onShopUpdated({ ...updated, sessionToken: shop.sessionToken });
      toast('Profile updated!');
      onClose();
    } catch { toast('Network error.', 'error'); }
    finally { setSaving(false); }
  };

  return createPortal(
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', zIndex: 2147483646, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      role="dialog" aria-modal="true"
    >
      <div onClick={e => e.stopPropagation()} style={{ backgroundColor: 'white', width: '100%', maxWidth: 520, maxHeight: '92vh', borderTopLeftRadius: 24, borderTopRightRadius: 24, display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ padding: '18px 20px 8px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.15rem', fontWeight: 800 }}>⚙️ Shop Profile</h3>
          <button onClick={onClose} aria-label="Close" style={{ border: 'none', background: 'transparent', fontSize: '1.4rem', color: '#64748b', cursor: 'pointer' }}>×</button>
        </div>

        <form onSubmit={submit} style={{ padding: '12px 18px 18px', overflowY: 'auto' }}>
          <Field label="Shop name" value={form.name} onChange={v => setForm({ ...form, name: v })} required />
          <Field label="Owner name" value={form.ownerName} onChange={v => setForm({ ...form, ownerName: v })} />
          <Field label="Full address" value={form.fullAddress} onChange={v => setForm({ ...form, fullAddress: v })} multiline />
          <Field label="Operating hours" value={form.operatingHours} onChange={v => setForm({ ...form, operatingHours: v })} placeholder="09:00 AM - 10:00 PM" />

          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: 12, margin: '12px 0' }}>
            <div style={{ fontSize: '0.78rem', color: '#15803d', fontWeight: 800, marginBottom: 6 }}>💸 UPI ID — required to send parchi bills</div>
            <input
              type="text"
              value={form.upiId}
              onChange={e => setForm({ ...form, upiId: e.target.value.trim() })}
              placeholder="yourshop@okhdfcbank"
              style={{ ...inputStyle, background: 'white' }}
              autoCapitalize="none"
              autoCorrect="off"
            />
            <div style={{ fontSize: '0.72rem', color: '#15803d', marginTop: 6 }}>
              Customers paying for a parchi bill via UPI will be sent to this address.
            </div>
          </div>

          <Field label="FSSAI" value={form.fssai} onChange={v => setForm({ ...form, fssai: v })} />
          <Field label="GST number" value={form.gst} onChange={v => setForm({ ...form, gst: v })} />
          <Field label="PAN number" value={form.panNumber} onChange={v => setForm({ ...form, panNumber: v })} />

          <button type="submit" disabled={saving} style={{ width: '100%', marginTop: 12, padding: 14, background: '#0f172a', color: 'white', border: 'none', borderRadius: 12, fontSize: '1rem', fontWeight: 800, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}

const Field = ({ label, value, onChange, required, placeholder, multiline }) => (
  <label style={{ display: 'block', marginBottom: 10 }}>
    <div style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 700, marginBottom: 4 }}>{label}{required && ' *'}</div>
    {multiline ? (
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
    ) : (
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required} style={inputStyle} />
    )}
  </label>
);

const inputStyle = { width: '100%', padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', boxSizing: 'border-box', outline: 'none', fontSize: '0.92rem', fontFamily: 'inherit' };

import React, { useEffect, useState, useCallback } from 'react';
import { userFetch } from '../../utils/api.js';
import { useToast } from '../../ui/DialogProvider.jsx';

const EMPTY_FORM = { label: 'Home', line1: '', line2: '', landmark: '', pincode: '', isDefault: false };

export default function AddressBook({ user }) {
  const triggerToast = useToast();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const res = await userFetch(user, `/users/${user._id}/addresses`);
      const data = res.ok ? await res.json() : [];
      setAddresses(Array.isArray(data) ? data : []);
    } catch { /* network errors leave the previous list visible */ }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const startAdd = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, pincode: user?.pincode || '', isDefault: addresses.length === 0 });
    setShowForm(true);
  };
  const startEdit = (addr) => {
    setEditingId(addr._id);
    setForm({
      label: addr.label || 'Home',
      line1: addr.line1 || '',
      line2: addr.line2 || '',
      landmark: addr.landmark || '',
      pincode: addr.pincode || '',
      isDefault: !!addr.isDefault,
    });
    setShowForm(true);
  };
  const cancel = () => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.line1.trim()) { triggerToast('Please enter address line 1', 'error'); return; }
    if (form.pincode && !/^\d{6}$/.test(form.pincode)) { triggerToast('Pincode must be 6 digits', 'error'); return; }
    setSaving(true);
    try {
      const path = editingId
        ? `/users/${user._id}/addresses/${editingId}`
        : `/users/${user._id}/addresses`;
      const res = await userFetch(user, path, {
        method: editingId ? 'PATCH' : 'POST',
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        triggerToast(err.error || 'Could not save address', 'error');
        return;
      }
      const list = await res.json();
      setAddresses(Array.isArray(list) ? list : []);
      cancel();
      triggerToast(editingId ? 'Address updated' : 'Address saved');
    } catch { triggerToast('Could not save address', 'error'); }
    finally { setSaving(false); }
  };

  const remove = async (addrId) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      const res = await userFetch(user, `/users/${user._id}/addresses/${addrId}`, { method: 'DELETE' });
      if (!res.ok) { triggerToast('Could not delete', 'error'); return; }
      const list = await res.json();
      setAddresses(Array.isArray(list) ? list : []);
      triggerToast('Address removed');
    } catch { triggerToast('Could not delete', 'error'); }
  };

  const setDefault = async (addr) => {
    if (addr.isDefault) return;
    try {
      const res = await userFetch(user, `/users/${user._id}/addresses/${addr._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isDefault: true }),
      });
      if (!res.ok) { triggerToast('Could not update default', 'error'); return; }
      const list = await res.json();
      setAddresses(Array.isArray(list) ? list : []);
      triggerToast('Default address updated');
    } catch { triggerToast('Could not update default', 'error'); }
  };

  return (
    <div style={{ marginBottom: 25 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <h3 style={{ color: '#334155', fontSize: '1.1rem', margin: 0 }}>My Addresses</h3>
        {!showForm && (
          <button onClick={startAdd} style={{ color: '#16a34a', background: 'none', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
            + Add New
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={submit} style={{ background: 'white', padding: 15, borderRadius: 12, marginBottom: 15, boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
          <select value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} style={{ ...inputStyle, marginBottom: 10 }}>
            <option value="Home">🏠 Home</option>
            <option value="Work">💼 Work</option>
            <option value="Other">📍 Other</option>
          </select>
          <input type="text" placeholder="Flat, House no., Building *" value={form.line1} onChange={e => setForm({ ...form, line1: e.target.value })} style={{ ...inputStyle, marginBottom: 10 }} required />
          <input type="text" placeholder="Area, Street" value={form.line2} onChange={e => setForm({ ...form, line2: e.target.value })} style={{ ...inputStyle, marginBottom: 10 }} />
          <input type="text" placeholder="Landmark" value={form.landmark} onChange={e => setForm({ ...form, landmark: e.target.value })} style={{ ...inputStyle, marginBottom: 10 }} />
          <input type="text" placeholder="Pincode (6 digits)" value={form.pincode} onChange={e => setForm({ ...form, pincode: e.target.value })} style={{ ...inputStyle, marginBottom: 10 }} inputMode="numeric" maxLength={6} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, color: '#475569', fontSize: '0.9rem' }}>
            <input type="checkbox" checked={form.isDefault} onChange={e => setForm({ ...form, isDefault: e.target.checked })} />
            Use as default address
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={cancel} style={{ flex: 1, padding: 10, background: '#f1f5f9', color: '#0f172a', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ flex: 2, padding: 10, background: '#0f172a', color: 'white', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving…' : (editingId ? 'Update Address' : 'Save Address')}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div style={{ color: '#94a3b8', fontSize: '0.85rem', padding: '10px 0' }}>Loading addresses…</div>
      ) : addresses.length === 0 ? (
        <div style={{ color: '#94a3b8', fontSize: '0.85rem', padding: '10px 0' }}>No saved addresses yet. Tap "+ Add New" to save one.</div>
      ) : (
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 5 }}>
          {addresses.map((addr) => (
            <div key={addr._id} style={{ minWidth: 240, background: 'white', padding: 15, borderRadius: 12, boxShadow: '0 4px 10px rgba(0,0,0,0.03)', border: addr.isDefault ? '2px solid #16a34a' : '1px solid #e2e8f0', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <strong style={{ color: '#0f172a' }}>{addr.label || 'Address'}</strong>
                {addr.isDefault && <span style={{ fontSize: '0.65rem', background: '#dcfce7', color: '#15803d', padding: '2px 6px', borderRadius: 6, fontWeight: 700 }}>DEFAULT</span>}
              </div>
              <div style={{ color: '#475569', fontSize: '0.85rem', lineHeight: 1.4, minHeight: 50 }}>
                {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}
                {addr.landmark ? <><br />Near {addr.landmark}</> : null}
                {addr.pincode ? <><br />— {addr.pincode}</> : null}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                {!addr.isDefault && (
                  <button onClick={() => setDefault(addr)} style={smallBtn('#dcfce7', '#15803d')}>Set default</button>
                )}
                <button onClick={() => startEdit(addr)} style={smallBtn('#eff6ff', '#1d4ed8')}>Edit</button>
                <button onClick={() => remove(addr._id)} style={smallBtn('#fee2e2', '#b91c1c')}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const inputStyle = { width: '100%', padding: 12, borderRadius: 8, border: '1px solid #cbd5e1', boxSizing: 'border-box', outline: 'none', fontSize: '0.9rem' };
const smallBtn = (bg, fg) => ({ background: bg, color: fg, border: 'none', padding: '5px 10px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' });

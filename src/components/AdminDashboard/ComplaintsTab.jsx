import React, { useEffect, useMemo, useState } from 'react';
import { useToast } from '../../ui/DialogProvider.jsx';
import ComplaintReplyThread from '../ShopDashboard/ComplaintReplyThread';
import { adminFetch } from '../../utils/api.js';

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

const FILTERS = [
  { key: 'all',      label: 'All' },
  { key: 'open',     label: 'Open' },
  { key: 'reviewed', label: 'Reviewed' },
  { key: 'resolved', label: 'Resolved' },
];

export default function ComplaintsTab() {
  const toast = useToast();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('open');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await adminFetch(`/complaints`);
      const data = res.ok ? await res.json() : [];
      setComplaints(Array.isArray(data) ? data : []);
    } catch {
      setComplaints([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const counts = useMemo(() => {
    const c = { all: complaints.length, open: 0, reviewed: 0, resolved: 0 };
    complaints.forEach(x => { c[x.status || 'open'] = (c[x.status || 'open'] || 0) + 1; });
    return c;
  }, [complaints]);

  const filtered = useMemo(() => {
    if (filter === 'all') return complaints;
    return complaints.filter(c => (c.status || 'open') === filter);
  }, [filter, complaints]);

  const setStatus = async (id, status) => {
    // Optimistic update — flip badge immediately, roll back on server error.
    const prev = complaints;
    setComplaints(prev.map(c => c._id === id ? { ...c, status } : c));
    try {
      const res = await adminFetch(`/complaints/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      toast(`Marked ${status}.`);
    } catch {
      setComplaints(prev);
      toast('Failed to update.', 'error');
    }
  };

  const handleReply = async (id, message) => {
    const res = await adminFetch(`/complaints/${id}/replies`, {
      method: 'POST',
      body: JSON.stringify({ authorType: 'admin', authorName: 'PackItOut Support', message }),
    });
    if (!res.ok) throw new Error('Could not send reply.');
    const updated = await res.json();
    setComplaints(curr => curr.map(c => c._id === id ? { ...updated, shopId: c.shopId } : c));
    return updated;
  };

  return (
    <div style={{ background: '#fff', borderRadius: '14px', padding: '20px', boxShadow: '0 4px 14px rgba(15,23,42,0.04)' }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <h3 style={{ margin: 0, color: '#0f172a' }}>📣 Customer Complaints ({complaints.length})</h3>
        <button
          onClick={fetchAll}
          style={{ padding: '8px 14px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
        >
          ↻ Refresh
        </button>
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {FILTERS.map(f => {
          const active = filter === f.key;
          const n = counts[f.key] ?? 0;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: '7px 14px',
                borderRadius: '999px',
                border: active ? '1px solid #0f172a' : '1px solid #e2e8f0',
                background: active ? '#0f172a' : '#fff',
                color: active ? '#fff' : '#0f172a',
                fontWeight: 800, fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              {f.label} <span style={{ marginLeft: '6px', background: active ? 'rgba(255,255,255,0.2)' : '#f1f5f9', color: active ? '#fff' : '#475569', padding: '1px 7px', borderRadius: '999px', fontSize: '0.72rem' }}>{n}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>Loading complaints…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
          <div style={{ fontSize: '2.4rem', marginBottom: '10px' }}>📭</div>
          <div style={{ fontWeight: 700 }}>No complaints in this view.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map(c => {
            const cat = CATEGORY_META[c.targetType] || CATEGORY_META.app;
            const stMeta = STATUS_META[c.status || 'open'] || STATUS_META.open;
            const created = c.createdAt ? new Date(c.createdAt) : null;
            const shopName = c.shopId && typeof c.shopId === 'object' ? c.shopId.name : null;
            return (
              <div key={c._id} style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px 16px', background: '#fff' }}>
                {/* Top row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ background: cat.bg, color: cat.fg, border: `1px solid ${cat.border}`, padding: '4px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800 }}>
                      {cat.icon} {cat.label}
                    </span>
                    <span style={{ background: stMeta.bg, color: stMeta.fg, padding: '4px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800 }}>
                      {stMeta.label}
                    </span>
                  </div>
                  {created && (
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>
                      {created.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  )}
                </div>

                {/* Meta */}
                <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600, marginBottom: '6px' }}>
                  From <span style={{ color: '#0f172a', fontWeight: 800 }}>{c.userName || 'Customer'}</span>
                  {c.userPhone && (
                    <> · <a href={`tel:${c.userPhone}`} style={{ color: '#3b82f6', textDecoration: 'none' }}>{c.userPhone}</a></>
                  )}
                  {shopName && (
                    <> · About <span style={{ color: '#0f172a', fontWeight: 800 }}>{shopName}</span></>
                  )}
                  {c.itemName && (
                    <> · Item: <span style={{ color: '#0f172a', fontWeight: 800 }}>{c.itemName}</span></>
                  )}
                </div>

                {/* Message */}
                <div style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '10px', padding: '10px 12px', color: '#0f172a', fontSize: '0.9rem', lineHeight: 1.5, whiteSpace: 'pre-wrap', marginBottom: '10px' }}>
                  {c.message}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {(c.status || 'open') !== 'reviewed' && (
                    <button
                      onClick={() => setStatus(c._id, 'reviewed')}
                      style={{ padding: '8px 14px', background: '#fef9c3', color: '#854d0e', border: '1px solid #fde68a', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', fontSize: '0.82rem' }}
                    >
                      Mark Reviewed
                    </button>
                  )}
                  {(c.status || 'open') !== 'resolved' && (
                    <button
                      onClick={() => setStatus(c._id, 'resolved')}
                      style={{ padding: '8px 14px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', fontSize: '0.82rem' }}
                    >
                      ✓ Mark Resolved
                    </button>
                  )}
                  {(c.status || 'open') !== 'open' && (
                    <button
                      onClick={() => setStatus(c._id, 'open')}
                      style={{ padding: '8px 14px', background: '#fff', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}
                    >
                      Reopen
                    </button>
                  )}
                </div>

                <ComplaintReplyThread
                  replies={c.replies}
                  composerLabel="Reply as admin"
                  composerPlaceholder="Respond on behalf of PackItOut Support…"
                  onSubmit={(msg) => handleReply(c._id, msg)}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

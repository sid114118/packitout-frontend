import React, { useEffect, useMemo, useState } from 'react';
import { useToast } from '../../ui/DialogProvider.jsx';
import ComplaintReplyThread from './ComplaintReplyThread';
import { shopFetch } from '../../utils/api.js';

const STATUS_META = {
  open:     { label: 'Open',     bg: '#fef2f2', fg: '#b91c1c', border: '#fecaca' },
  reviewed: { label: 'Reviewed', bg: '#fef9c3', fg: '#854d0e', border: '#fde68a' },
  resolved: { label: 'Resolved', bg: '#ecfdf5', fg: '#15803d', border: '#bbf7d0' },
};

const CATEGORY_LABEL = {
  shop: { icon: '🏪', label: 'About your shop' },
  item: { icon: '🛒', label: 'About an item' },
  app:  { icon: '📱', label: 'About the app' },
};

export default function ComplaintsTab({ shop }) {
  const toast = useToast();
  const shopId = shop?._id;
  const shopName = shop?.name;
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showResolved, setShowResolved] = useState(false);

  const fetchAll = async () => {
    if (!shopId) return;
    setLoading(true);
    try {
      const res = await shopFetch(shop, `/complaints/shop/${shopId}`);
      const data = res.ok ? await res.json() : [];
      setComplaints(Array.isArray(data) ? data : []);
    } catch {
      setComplaints([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [shopId]);

  const { active, past } = useMemo(() => {
    const active = [], past = [];
    complaints.forEach(c => {
      const st = c.status || 'open';
      if (st === 'resolved') past.push(c);
      else active.push(c);
    });
    return { active, past };
  }, [complaints]);

  const setStatus = async (id, status) => {
    const prev = complaints;
    setComplaints(prev.map(c => c._id === id ? { ...c, status } : c));
    try {
      const res = await shopFetch(shop, `/complaints/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      toast(status === 'resolved' ? 'Marked resolved.' : 'Marked reviewed.');
    } catch {
      setComplaints(prev);
      toast('Could not update.', 'error');
    }
  };
  const acknowledge = (id) => setStatus(id, 'reviewed');
  const resolve = (id) => setStatus(id, 'resolved');

  const handleReply = async (id, message) => {
    // authorType / authorName are derived server-side from the bearer token now;
    // we no longer send them in the body. Posting as a logged-in shop produces
    // authorType='shop' automatically.
    const res = await shopFetch(shop, `/complaints/${id}/replies`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
    if (!res.ok) throw new Error('Could not send reply.');
    const updated = await res.json();
    setComplaints(curr => curr.map(c => c._id === id ? updated : c));
    return updated;
  };

  const Card = ({ c }) => {
    const stMeta = STATUS_META[c.status || 'open'] || STATUS_META.open;
    const catMeta = CATEGORY_LABEL[c.targetType] || CATEGORY_LABEL.app;
    const created = c.createdAt ? new Date(c.createdAt) : null;
    return (
      <div style={{ background: '#fff', padding: '16px', borderRadius: '14px', border: `1px solid ${stMeta.border}`, marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 700 }}>
              {catMeta.icon} {catMeta.label}
            </div>
            {c.itemName && (
              <div style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 800, marginTop: '2px' }}>
                Item: {c.itemName}
              </div>
            )}
          </div>
          <span style={{ background: stMeta.bg, color: stMeta.fg, padding: '4px 10px', borderRadius: '999px', fontSize: '0.74rem', fontWeight: 800, border: `1px solid ${stMeta.border}` }}>
            {stMeta.label}
          </span>
        </div>

        <div style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '10px', padding: '10px 12px', color: '#0f172a', fontSize: '0.9rem', lineHeight: 1.5, whiteSpace: 'pre-wrap', marginBottom: '10px' }}>
          {c.message}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
            From <span style={{ color: '#0f172a', fontWeight: 800 }}>{c.userName || 'Customer'}</span>
            {c.userPhone && (
              <> · <a href={`tel:${c.userPhone}`} style={{ color: '#3b82f6', textDecoration: 'none' }}>{c.userPhone}</a></>
            )}
            {created && <> · {created.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</>}
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(c.status || 'open') === 'open' && (
              <button
                onClick={() => acknowledge(c._id)}
                style={{ padding: '8px 14px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', fontSize: '0.8rem' }}
              >
                Mark Reviewed
              </button>
            )}
            {c.status !== 'resolved' && (
              <button
                onClick={() => resolve(c._id)}
                style={{ padding: '8px 14px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', fontSize: '0.8rem' }}
              >
                Mark Resolved
              </button>
            )}
          </div>
        </div>

        <ComplaintReplyThread
          replies={c.replies}
          composerLabel="Reply to customer"
          composerPlaceholder="Apologize, explain, or offer a fix…"
          onSubmit={(msg) => handleReply(c._id, msg)}
        />

        <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, marginTop: '8px' }}>
          Final resolution is handled by the PackItOut admin team.
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.2rem' }}>
          📣 Customer Complaints {active.length > 0 && <span style={{ color: '#ef4444' }}>({active.length})</span>}
        </h3>
        <button
          onClick={fetchAll}
          style={{ padding: '7px 12px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}
        >
          ↻
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>Loading…</div>
      ) : active.length === 0 && past.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', background: '#fff', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
          <div style={{ fontSize: '2.4rem', marginBottom: '10px' }}>🌿</div>
          <div style={{ fontWeight: 800, color: '#0f172a' }}>No complaints — nice work!</div>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '4px' }}>Customer feedback about your shop will appear here.</div>
        </div>
      ) : (
        <>
          {active.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', background: '#fff', borderRadius: '14px', border: '1px dashed #cbd5e1', color: '#94a3b8', marginBottom: '20px' }}>
              No active complaints. ✨
            </div>
          ) : (
            <div style={{ marginBottom: '20px' }}>
              {active.map(c => <Card key={c._id} c={c} />)}
            </div>
          )}

          {past.length > 0 && (
            <>
              <div
                onClick={() => setShowResolved(s => !s)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: '#fff', padding: '14px 18px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '12px' }}
              >
                <h4 style={{ margin: 0, color: '#334155', fontSize: '1rem' }}>Resolved ({past.length})</h4>
                <span style={{ fontSize: '1.1rem', transform: showResolved ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>🔽</span>
              </div>
              {showResolved && past.map(c => <Card key={c._id} c={c} />)}
            </>
          )}
        </>
      )}
    </div>
  );
}

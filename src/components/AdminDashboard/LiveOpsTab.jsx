import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from '../../ui/DialogProvider.jsx';
import { useOrderAlarm } from '../../utils/orderAlarm.js';
import { adminFetch } from '../../utils/api.js';

// What counts as "needs ops attention". Tuned to match the shop-side alarm
// thresholds (see [[packitout-pickup-and-complaints]] for context).
const PENDING_STALL_MS  = 2  * 60 * 1000;  // shop hasn't accepted
const ACCEPTED_STALL_MS = 30 * 60 * 1000;  // accepted but stuck in Packing / hasn't marked Ready
const READY_STALL_MS    = 10 * 60 * 1000;  // marked Ready but customer hasn't picked up

const BASE_URL = (import.meta.env.VITE_API_BASE || "https://darkslategrey-snail-415133.hostingersite.com");

const fmtAgo = (ms) => {
  if (ms < 60 * 1000) return `${Math.floor(ms / 1000)}s ago`;
  if (ms < 60 * 60 * 1000) return `${Math.floor(ms / 60000)} min ago`;
  return `${Math.floor(ms / 3600000)} h ago`;
};

const fmtDuration = (ms) => {
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

// Pulls the latest at the time the order entered its current status. Falls
// back to createdAt for orders placed before statusHistory existed.
const enteredCurrentStatusAt = (order) => {
  const history = order.statusHistory || [];
  const match = [...history].reverse().find(h => h.status === order.status);
  return match?.at ? new Date(match.at).getTime() : new Date(order.createdAt).getTime();
};

const classifyProblem = (order, now) => {
  const status = order.status || '';
  if (status.includes('✅') || status.includes('❌')) return null;

  if (status === 'Pending') {
    const ageMs = now - new Date(order.createdAt).getTime();
    if (ageMs >= PENDING_STALL_MS) {
      return { kind: 'stalled_pending', stalledFor: ageMs, severity: 'high' };
    }
    return null;
  }

  if (/ready|collect/i.test(status)) {
    const sinceMs = now - enteredCurrentStatusAt(order);
    if (sinceMs >= READY_STALL_MS) {
      return { kind: 'unpicked_ready', stalledFor: sinceMs, severity: 'medium' };
    }
    return null;
  }

  if (/accept|prepar|pack/i.test(status)) {
    const sinceMs = now - enteredCurrentStatusAt(order);
    if (sinceMs >= ACCEPTED_STALL_MS) {
      return { kind: 'slow_packing', stalledFor: sinceMs, severity: 'medium' };
    }
    return null;
  }

  return null;
};

const severityColor = (sev) => sev === 'high' ? '#ef4444' : '#f59e0b';

export default function LiveOpsTab() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [actingOnId, setActingOnId] = useState(null);
  const [noteDrafts, setNoteDrafts] = useState({}); // orderId -> draft text

  // Poll + tick — we need both fresh data and a re-evaluated "stalled" clock.
  useEffect(() => {
    let cancelled = false;
    const fetchOrders = async () => {
      try {
        const res = await adminFetch(`/orders`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setOrders(Array.isArray(data) ? data : []);
      } catch (e) { /* swallow — next tick retries */ }
      finally { if (!cancelled) setLoading(false); }
    };
    fetchOrders();
    const refresh = setInterval(fetchOrders, 15000);
    const tick = setInterval(() => setNow(Date.now()), 15000);
    return () => { cancelled = true; clearInterval(refresh); clearInterval(tick); };
  }, []);

  const problems = useMemo(() => {
    return (orders || [])
      .map(o => ({ order: o, problem: classifyProblem(o, now) }))
      .filter(x => x.problem)
      .sort((a, b) => b.problem.stalledFor - a.problem.stalledFor);
  }, [orders, now]);

  // Alarm when any high-severity (stalled Pending) order is in the queue.
  const highSeverityCount = problems.filter(p => p.problem.severity === 'high').length;
  const { muted, setMuted, needsUnlock, unlock } = useOrderAlarm(highSeverityCount > 0, { intervalMs: 3500 });

  const updateOrderInPlace = (id, patch) => {
    setOrders(prev => prev.map(o => o._id === id ? { ...o, ...patch } : o));
  };

  const handleForceAccept = async (order) => {
    if (!window.confirm(`Force-accept order #${order._id.slice(-5).toUpperCase()} on behalf of the shop?`)) return;
    setActingOnId(order._id);
    try {
      const res = await adminFetch(`/admin/orders/${order._id}/force-accept`, {
        method: 'POST',
        body: JSON.stringify({ adminName: 'admin', reason: 'Confirmed verbally by shop' }),
      });
      if (res.ok) {
        toast('✅ Order force-accepted');
        updateOrderInPlace(order._id, { status: 'Accepted 👨‍🍳' });
      } else {
        const err = await res.json().catch(() => ({}));
        toast(err.error || 'Force-accept failed', 'error');
      }
    } catch (e) { toast('Network error', 'error'); }
    setActingOnId(null);
  };

  const handleForceCancel = async (order) => {
    const reason = window.prompt(`Cancel order #${order._id.slice(-5).toUpperCase()}? Coins will be auto-refunded; any UPI receipt will be flagged for the shop to refund manually. Enter a reason:`);
    if (!reason) return;
    setActingOnId(order._id);
    try {
      const res = await adminFetch(`/admin/orders/${order._id}/force-cancel`, {
        method: 'POST',
        body: JSON.stringify({ adminName: 'admin', reason }),
      });
      if (res.ok) {
        toast('❌ Order cancelled + refund flagged');
        updateOrderInPlace(order._id, { status: 'Cancelled ❌ (shop unresponsive)' });
      } else {
        const err = await res.json().catch(() => ({}));
        toast(err.error || 'Force-cancel failed', 'error');
      }
    } catch (e) { toast('Network error', 'error'); }
    setActingOnId(null);
  };

  const handlePingShop = async (order) => {
    setActingOnId(order._id);
    try {
      const shopId = typeof order.shopId === 'object' ? order.shopId?._id : order.shopId;
      const res = await adminFetch(`/admin/ping-shop`, {
        method: 'POST',
        body: JSON.stringify({ shopId, orderId: order._id, adminName: 'admin' }),
      });
      if (res.ok) toast("🔔 Urgent ping sent");
      else toast('Ping failed', 'error');
    } catch (e) { toast('Network error', 'error'); }
    setActingOnId(null);
  };

  const handleAddNote = async (order) => {
    const text = (noteDrafts[order._id] || '').trim();
    if (!text) return;
    try {
      const res = await adminFetch(`/admin/orders/${order._id}/ops-log`, {
        method: 'POST',
        body: JSON.stringify({ text, adminName: 'admin', action: 'note' }),
      });
      if (res.ok) {
        const data = await res.json();
        updateOrderInPlace(order._id, { opsLog: data.opsLog });
        setNoteDrafts(prev => ({ ...prev, [order._id]: '' }));
      } else {
        toast('Failed to save note', 'error');
      }
    } catch (e) { toast('Network error', 'error'); }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading ops board…</div>;
  }

  return (
    <div>
      {/* 🚨 ALARM BANNER */}
      {highSeverityCount > 0 && (
        <div style={alarmBannerStyle}>
          <style>{`@keyframes opsAlarmPulse { 0%, 100% { box-shadow: 0 10px 25px rgba(239, 68, 68, 0.35); } 50% { box-shadow: 0 10px 35px rgba(239, 68, 68, 0.7); } }`}</style>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <span style={{ fontSize: '1.4rem' }}>🚨</span>
            <div>
              <div style={{ fontWeight: 900, fontSize: '0.95rem' }}>
                {highSeverityCount} shop{highSeverityCount > 1 ? 's' : ''} not responding — call them now
              </div>
              <div style={{ fontSize: '0.78rem', opacity: 0.9 }}>Use the 📞 Call Shop button on the card</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            {needsUnlock && !muted && (
              <button onClick={unlock} style={enableSoundBtn}>🔔 Enable sound</button>
            )}
            <button onClick={() => setMuted(!muted)} style={muteBtn}>
              {muted ? '🔈 Unmute' : '🔇 Mute'}
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0, color: '#0f172a' }}>
          🛡️ Live Ops Board <span style={{ color: '#64748b', fontWeight: 500, fontSize: '0.9rem' }}>({problems.length} problem{problems.length === 1 ? '' : 's'})</span>
        </h3>
        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Auto-refreshes every 15s</div>
      </div>

      {problems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', backgroundColor: 'white', borderRadius: '16px', border: '1px dashed #cbd5e1', color: '#94a3b8' }}>
          <div style={{ fontSize: '2.2rem', marginBottom: '10px' }}>✅</div>
          <div style={{ fontWeight: 'bold', color: '#475569' }}>All orders moving normally</div>
          <div style={{ fontSize: '0.85rem' }}>No stalled orders right now. Shops are accepting and customers are picking up on time.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {problems.map(({ order, problem }) => (
            <ProblemCard
              key={order._id}
              order={order}
              problem={problem}
              acting={actingOnId === order._id}
              noteDraft={noteDrafts[order._id] || ''}
              onNoteChange={(t) => setNoteDrafts(prev => ({ ...prev, [order._id]: t }))}
              onForceAccept={() => handleForceAccept(order)}
              onForceCancel={() => handleForceCancel(order)}
              onPingShop={() => handlePingShop(order)}
              onAddNote={() => handleAddNote(order)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProblemCard({ order, problem, acting, noteDraft, onNoteChange, onForceAccept, onForceCancel, onPingShop, onAddNote }) {
  const shortId = order._id.slice(-5).toUpperCase();
  const shop = order.shopId || {};
  const user = order.userId || {};
  const shopPhone = shop.phone || '';
  const customerPhone = user.phone || '';
  const isPending = order.status === 'Pending';
  const opsLog = order.opsLog || [];

  const problemCopy = {
    stalled_pending: 'STALLED — shop has not accepted',
    slow_packing:    'SLOW — shop accepted but not yet Ready',
    unpicked_ready:  'NOT PICKED UP — customer hasn\'t collected',
  }[problem.kind] || 'STALLED';

  return (
    <div style={{ backgroundColor: 'white', borderRadius: '14px', border: `2px solid ${severityColor(problem.severity)}`, boxShadow: '0 6px 18px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
      {/* Header banner */}
      <div style={{ background: severityColor(problem.severity), color: '#fff', padding: '10px 16px', fontWeight: 800, fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{problemCopy}</span>
        <span style={{ background: 'rgba(255,255,255,0.22)', padding: '3px 10px', borderRadius: '6px', fontSize: '0.78rem' }}>
          ⏱ {fmtDuration(problem.stalledFor)}
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Order line */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
          <div>
            <div style={{ fontWeight: 900, color: '#0f172a' }}>Order #{shortId}</div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{fmtAgo(Date.now() - new Date(order.createdAt).getTime())} · {order.status}</div>
          </div>
          <div style={{ fontWeight: 900, fontSize: '1.1rem' }}>₹{order.totalAmount}</div>
        </div>

        {/* Two-column contacts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
          <div style={contactBoxStyle}>
            <div style={contactLabelStyle}>🏪 Shop</div>
            <div style={contactNameStyle}>{shop.name || '—'}</div>
            <div style={contactPhoneStyle}>{shopPhone || 'no phone on file'}</div>
            {shopPhone && (
              <a href={`tel:${shopPhone}`} style={callBtnStyle}>📞 Call Shop</a>
            )}
          </div>
          <div style={contactBoxStyle}>
            <div style={contactLabelStyle}>👤 Customer</div>
            <div style={contactNameStyle}>{user.name || '—'}</div>
            <div style={contactPhoneStyle}>{customerPhone || 'no phone on file'}</div>
            {customerPhone && (
              <a href={`tel:${customerPhone}`} style={callBtnStyle}>📞 Call Customer</a>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
          <button onClick={onPingShop} disabled={acting} style={actionBtnStyle('#fffbeb', '#d97706', '#fcd34d')}>🔔 Ping Shop</button>
          {isPending && (
            <button onClick={onForceAccept} disabled={acting} style={actionBtnStyle('#ecfdf5', '#059669', '#a7f3d0')}>✅ Force Accept</button>
          )}
          <button onClick={onForceCancel} disabled={acting} style={actionBtnStyle('#fef2f2', '#dc2626', '#fecaca')}>❌ Force Cancel + Refund</button>
        </div>

        {/* Ops log */}
        <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '12px' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, marginBottom: '8px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            Ops trail ({opsLog.length})
          </div>
          {opsLog.length === 0 ? (
            <div style={{ fontSize: '0.82rem', color: '#94a3b8', fontStyle: 'italic', marginBottom: '8px' }}>No notes yet. Add what you tried — next admin will see it.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
              {opsLog.slice(-6).map((entry, i) => (
                <div key={i} style={{ fontSize: '0.82rem', color: '#334155', background: '#f8fafc', padding: '6px 10px', borderRadius: '8px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>{new Date(entry.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} · {entry.adminName} · {entry.action}</span>
                  <div style={{ marginTop: '2px' }}>{entry.text}</div>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              type="text"
              placeholder='e.g. "Called shop, no answer"'
              value={noteDraft}
              onChange={(e) => onNoteChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') onAddNote(); }}
              style={{ flex: 1, padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
            />
            <button onClick={onAddNote} disabled={!noteDraft.trim()} style={{ padding: '8px 14px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: noteDraft.trim() ? 'pointer' : 'not-allowed', opacity: noteDraft.trim() ? 1 : 0.5 }}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const alarmBannerStyle = {
  marginBottom: '15px',
  background: 'linear-gradient(90deg, #ef4444, #dc2626)', color: '#fff',
  padding: '14px 16px', borderRadius: '12px',
  boxShadow: '0 10px 25px rgba(239, 68, 68, 0.35)',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
  animation: 'opsAlarmPulse 1.2s ease-in-out infinite',
};
const enableSoundBtn = { background: '#fff', color: '#dc2626', border: 'none', padding: '8px 12px', borderRadius: '8px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' };
const muteBtn = { background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)', padding: '8px 12px', borderRadius: '8px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' };
const contactBoxStyle = { background: '#f8fafc', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0' };
const contactLabelStyle = { fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' };
const contactNameStyle = { fontWeight: 800, color: '#0f172a', fontSize: '0.95rem', marginTop: '3px' };
const contactPhoneStyle = { fontSize: '0.82rem', color: '#475569', marginBottom: '8px' };
const callBtnStyle = { display: 'inline-block', padding: '7px 12px', background: '#16a34a', color: '#fff', borderRadius: '8px', fontWeight: 800, fontSize: '0.82rem', textDecoration: 'none' };
const actionBtnStyle = (bg, color, border) => ({ padding: '8px 14px', backgroundColor: bg, color, border: `1px solid ${border}`, borderRadius: '8px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' });

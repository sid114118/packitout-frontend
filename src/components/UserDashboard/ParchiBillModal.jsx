import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useToast } from '../../ui/DialogProvider.jsx';
import { userFetch } from '../../utils/api.js';
import { cdnImage } from '../../utils/cloudinaryUrl.js';

// Lists the user's parchis (status: quoted = bill waiting, accepted = paid /
// pay-on-pickup confirmed). The "quoted" rows offer two payment buttons:
//   UPI       — opens upi://pay?pa=<shopUpiId>... so the user can pay via any
//               UPI app; then POSTs /accept-bill with paymentMethod='UPI'.
//   Pay on Pickup — POSTs /accept-bill with paymentMethod='POP'.
// Either way the bill becomes a real Order on the server, surfacing in
// OrdersPage like a normal order.
export default function ParchiBillModal({ open, onClose, user }) {
  const toast = useToast();
  const [parchis, setParchis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);

  const refresh = useCallback(async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const res = await userFetch(user, `/parchis/user/${user._id}/all`);
      const data = res.ok ? await res.json() : [];
      setParchis(Array.isArray(data) ? data : []);
    } catch { /* keep previous list */ }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { if (open) refresh(); }, [open, refresh]);

  if (!open) return null;

  const payViaUpi = (parchi) => {
    const bill = parchi.bill || {};
    if (!bill.shopUpiId) { toast('Shop has not set a UPI ID yet.', 'error'); return; }
    const shortId = parchi._id.slice(-5).toUpperCase();
    const note = `PackItOut Parchi #${shortId}`;
    const params = new URLSearchParams({
      pa: bill.shopUpiId,
      pn: bill.shopName || 'Shop',
      am: String(bill.totalAmount || 0),
      cu: 'INR',
      tn: note,
    });
    // Deep link opens any installed UPI app; if none, the browser falls back.
    window.location.href = `upi://pay?${params.toString()}`;
  };

  const confirmUpiPaid = async (parchi) => {
    if (!window.confirm('Confirm only after the UPI payment is successful. Continue?')) return;
    await accept(parchi, 'UPI');
  };

  const acceptPop = async (parchi) => {
    if (!window.confirm('Confirm pay-on-pickup? You will pay the shop directly when you collect your order.')) return;
    await accept(parchi, 'POP');
  };

  const accept = async (parchi, method) => {
    setActingId(parchi._id);
    try {
      const res = await userFetch(user, `/parchis/${parchi._id}/accept-bill`, {
        method: 'POST',
        body: JSON.stringify({ paymentMethod: method }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast(err.error || 'Could not confirm bill', 'error');
        return;
      }
      toast('Order placed! Check My Orders for status.');
      await refresh();
    } catch { toast('Network error.', 'error'); }
    finally { setActingId(null); }
  };

  const quoted = parchis.filter(p => p.status === 'quoted');
  const otherRecent = parchis.filter(p => p.status !== 'quoted').slice(0, 6);

  return createPortal(
    <div onClick={onClose} style={overlayStyle} role="dialog" aria-modal="true">
      <div onClick={e => e.stopPropagation()} style={sheetStyle}>
        <div style={{ padding: '18px 20px 8px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.15rem', fontWeight: 800 }}>🧾 My Parchi Bills</h3>
          <button onClick={onClose} aria-label="Close" style={{ border: 'none', background: 'transparent', fontSize: '1.4rem', color: '#64748b', cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ overflowY: 'auto', padding: 14 }}>
          {loading ? (
            <div style={{ color: '#94a3b8', padding: 30, textAlign: 'center' }}>Loading…</div>
          ) : quoted.length === 0 && otherRecent.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {quoted.length > 0 && (
                <>
                  <SectionLabel>Awaiting Your Payment</SectionLabel>
                  {quoted.map(p => (
                    <QuotedBillCard
                      key={p._id}
                      parchi={p}
                      busy={actingId === p._id}
                      onPayUpi={() => payViaUpi(p)}
                      onConfirmUpiPaid={() => confirmUpiPaid(p)}
                      onAcceptPop={() => acceptPop(p)}
                    />
                  ))}
                </>
              )}
              {otherRecent.length > 0 && (
                <>
                  <SectionLabel>Recent</SectionLabel>
                  {otherRecent.map(p => <RecentParchiRow key={p._id} parchi={p} />)}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

const SectionLabel = ({ children }) => (
  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, margin: '4px 0 8px' }}>{children}</div>
);

const EmptyState = () => (
  <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
    <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🧾</div>
    No parchi bills yet. Upload a handwritten list from the shop page and the shop will send you a bill here.
  </div>
);

function QuotedBillCard({ parchi, busy, onPayUpi, onConfirmUpiPaid, onAcceptPop }) {
  const bill = parchi.bill || {};
  return (
    <div style={{ background: 'white', border: '2px solid #bbf7d0', borderRadius: 16, padding: 14, marginBottom: 14, boxShadow: '0 4px 12px rgba(22,163,74,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        {parchi.imageUrl && (
          <img src={cdnImage(parchi.imageUrl, 160)} alt="parchi" style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', border: '1px solid #e2e8f0' }} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>{bill.shopName || 'Shop'}</div>
          <div style={{ color: '#64748b', fontSize: '0.78rem' }}>Bill sent {bill.sentAt ? new Date(bill.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</div>
        </div>
        <div style={{ fontSize: '1.3rem', color: '#16a34a', fontWeight: 900 }}>₹{bill.totalAmount}</div>
      </div>

      <div style={{ background: '#f8fafc', borderRadius: 10, padding: 10, marginBottom: 12 }}>
        {(bill.items || []).map((it, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#334155', padding: '3px 0' }}>
            <span>{it.emoji ? `${it.emoji} ` : ''}{it.name} × {it.qty}</span>
            <span style={{ fontWeight: 700 }}>₹{it.price * it.qty}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <button onClick={onPayUpi} disabled={busy} style={primaryBtn('#3b82f6')}>
          💸 Open UPI App
        </button>
        <button onClick={onAcceptPop} disabled={busy} style={primaryBtn('#0f172a')}>
          🛍️ Pay on Pickup
        </button>
      </div>
      <button onClick={onConfirmUpiPaid} disabled={busy} style={{ width: '100%', marginTop: 8, padding: 10, background: '#dcfce7', color: '#15803d', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: '0.85rem', cursor: busy ? 'wait' : 'pointer' }}>
        ✅ I have paid via UPI — confirm order
      </button>
      <div style={{ marginTop: 6, fontSize: '0.7rem', color: '#94a3b8', textAlign: 'center' }}>
        Pay to: <strong>{bill.shopUpiId}</strong>
      </div>
    </div>
  );
}

function RecentParchiRow({ parchi }) {
  const bill = parchi.bill || {};
  const label = parchi.status === 'accepted'
    ? `Paid via ${parchi.acceptedPaymentMethod === 'UPI' ? 'UPI' : 'Pay on Pickup'}`
    : parchi.status === 'pending' ? 'Awaiting shop quote'
    : parchi.status;
  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>{bill.shopName || 'Shop'}</div>
        <div style={{ color: '#64748b', fontSize: '0.78rem' }}>{label}</div>
      </div>
      {bill.totalAmount ? <div style={{ fontWeight: 800, color: '#16a34a' }}>₹{bill.totalAmount}</div> : null}
    </div>
  );
}

const primaryBtn = (bg) => ({ padding: 12, background: bg, color: 'white', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer' });

const overlayStyle = { position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', zIndex: 2147483646, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' };
const sheetStyle = { backgroundColor: 'white', width: '100%', maxWidth: 520, maxHeight: '92vh', borderTopLeftRadius: 24, borderTopRightRadius: 24, display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif' };

import React, { useEffect, useState } from 'react';
import { useToast } from '../../ui/DialogProvider.jsx';

const BASE_URL = (import.meta.env.VITE_API_BASE || "https://darkslategrey-snail-415133.hostingersite.com");

const fmtMoney = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtDateTime = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit' }) : '—';

export default function UserProfileModal({ open, userId, onClose }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => {
    if (!open || !userId) return;
    let cancelled = false;
    setLoading(true);
    setData(null);
    fetch(`${BASE_URL}/admin/users/${userId}/profile`)
      .then(r => r.json().then(j => ({ ok: r.ok, j })))
      .then(({ ok, j }) => {
        if (cancelled) return;
        if (!ok) {
          toast(j.error || "Could not load user profile.", 'error');
          setData(null);
        } else {
          setData(j);
          setExpandedOrderId(null);
        }
        setLoading(false);
      })
      .catch(() => { if (!cancelled) { setLoading(false); toast("Network error loading user.", 'error'); } });
    return () => { cancelled = true; };
  }, [open, userId]);

  if (!open) return null;

  return (
    <div onClick={onClose} style={overlayStyle}>
      <div onClick={(e) => e.stopPropagation()} style={modalStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <div style={avatarStyle}>{(data?.user?.name || '?').trim().charAt(0).toUpperCase()}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 900, fontSize: '1.1rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {loading ? 'Loading…' : (data?.user?.name || 'Customer')}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>
                {data?.user?.phone || '—'} · Joined {fmtDate(data?.stats?.joinedAt)}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={closeBtnStyle}>✕</button>
        </div>

        {/* Body */}
        <div style={bodyStyle}>
          {loading && <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading profile…</div>}
          {!loading && !data && <div style={{ padding: 40, textAlign: 'center', color: '#ef4444' }}>Couldn't load this user.</div>}
          {!loading && data && (
            <>
              {/* PROFILE + STATS */}
              <Section title="📇 Profile">
                <div style={kvGridStyle}>
                  <KV label="Phone" value={data.user.phone} />
                  <KV label="Pincode" value={data.user.pincode || '—'} />
                  <KV label="Address" value={data.user.address || '—'} wide />
                  <KV label="Coin balance" value={`🪙 ${data.user.coins ?? 0}`} />
                  <KV label="Referral code" value={data.user.referralCode || '—'} />
                  <KV label="Referred by" value={data.user.referredBy || '—'} />
                  <KV label="Primary shop" value={data.user.primaryShop?.name || '—'} />
                </div>
              </Section>

              <Section title="📊 Lifetime stats">
                <div style={statsGridStyle}>
                  <Stat label="Total orders" value={data.stats.totalOrders} accent="#0ea5e9" />
                  <Stat label="Successful" value={data.stats.successfulOrders} accent="#10b981" />
                  <Stat label="Cancelled" value={data.stats.cancelledOrders} accent="#ef4444" />
                  <Stat label="Lifetime spend" value={fmtMoney(data.stats.totalSpent)} accent="#0f172a" />
                  <Stat label="Coins redeemed" value={`🪙 ${data.stats.totalCoinsSpent}`} accent="#f59e0b" />
                  <Stat label="Days since last order" value={data.stats.daysSinceLastOrder ?? '—'} accent="#8b5cf6" />
                </div>
              </Section>

              {/* INTERESTS */}
              <Section title="🎯 Interests (derived from order history)">
                {data.stats.successfulOrders === 0 ? (
                  <div style={emptyStyle}>No orders yet — nothing to derive.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {data.interests.favouriteShop && (
                      <div style={pillRowStyle}>
                        <span style={pillLabelStyle}>Favourite shop</span>
                        <span style={pillValueStyle}>
                          🏪 {data.interests.favouriteShop.name} · {data.interests.favouriteShop.orderCount} orders
                        </span>
                      </div>
                    )}

                    <div>
                      <div style={subLabelStyle}>Top brands</div>
                      <div style={chipRowStyle}>
                        {data.interests.topBrands.length === 0 && <span style={{ color: '#94a3b8' }}>—</span>}
                        {data.interests.topBrands.map(b => (
                          <span key={b.brand} style={chipStyle('#dbeafe', '#1e40af')}>
                            {b.brand} <span style={{ opacity: 0.7 }}>×{b.qty}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div style={subLabelStyle}>Most-ordered items</div>
                      <div style={chipRowStyle}>
                        {data.interests.topItems.length === 0 && <span style={{ color: '#94a3b8' }}>—</span>}
                        {data.interests.topItems.map((it, idx) => (
                          <span key={idx} style={chipStyle('#dcfce7', '#166534')}>
                            {it.emoji || '🛒'} {it.name} <span style={{ opacity: 0.7 }}>×{it.qty}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div style={pillRowStyle}>
                      <span style={pillLabelStyle}>Order style</span>
                      <span style={pillValueStyle}>
                        ⚡ {Math.round(data.interests.urgentRatio * 100)}% urgent · 💵 {Math.round(data.interests.codRatio * 100)}% COD
                      </span>
                    </div>
                  </div>
                )}
              </Section>

              {/* ORDER HISTORY */}
              <Section title={`📦 Order history (${data.orders.length})`}>
                {data.orders.length === 0 ? (
                  <div style={emptyStyle}>No orders placed yet.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {data.orders.map(o => {
                      const expanded = expandedOrderId === o._id;
                      const isCancel = /cancel|reject/i.test(o.status || '');
                      const shortId = String(o._id).slice(-5).toUpperCase();
                      return (
                        <div key={o._id} style={orderCardStyle(isCancel)}>
                          <button
                            onClick={() => setExpandedOrderId(expanded ? null : o._id)}
                            style={orderHeadBtnStyle}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px', minWidth: 0 }}>
                              <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>
                                #{shortId} · {o.shopId?.name || 'Shop deleted'}
                              </span>
                              <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>
                                {fmtDateTime(o.createdAt)} · {o.paymentMethod} · {o.items?.length || 0} items
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                              <span style={statusPillStyle(isCancel)}>{o.status || 'Pending'}</span>
                              <span style={{ fontWeight: 900, color: '#0f172a' }}>{fmtMoney(o.totalAmount)}</span>
                              <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{expanded ? '▴' : '▾'}</span>
                            </div>
                          </button>
                          {expanded && (
                            <div style={orderBodyStyle}>
                              {(o.items || []).map((line, idx) => (
                                <div key={idx} style={lineItemStyle}>
                                  <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {line.emoji || '🛒'} {line.name} {line.qnty ? <span style={{ color: '#94a3b8' }}>· {line.qnty}</span> : null}
                                  </span>
                                  <span style={{ color: '#64748b', fontWeight: 700 }}>×{line.qty}</span>
                                  <span style={{ minWidth: 56, textAlign: 'right', fontWeight: 700 }}>{fmtMoney((line.price || 0) * (line.qty || 1))}</span>
                                </div>
                              ))}
                              <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed #e2e8f0', display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>
                                <span>
                                  Coins used: 🪙 {o.coinsUsed || 0}
                                  {o.isUrgent && <span style={{ marginLeft: 8, color: '#dc2626' }}>· ⚡ Urgent</span>}
                                  {o.pickupTime && <span style={{ marginLeft: 8 }}>· 🕒 {fmtDateTime(o.pickupTime)}</span>}
                                </span>
                                <span>Payment: {o.paymentStatus}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Section>

              {/* REVIEWS */}
              <Section title={`⭐ Reviews left (${data.reviews.length})`}>
                {data.reviews.length === 0 ? (
                  <div style={emptyStyle}>No reviews yet.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {data.reviews.map(r => (
                      <div key={r._id} style={subCardStyle}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontWeight: 800, color: '#0f172a' }}>{'⭐'.repeat(r.rating)} · {r.targetType}</span>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>{fmtDate(r.createdAt)}</span>
                        </div>
                        {r.comment && <div style={{ color: '#475569', fontSize: '0.9rem' }}>{r.comment}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </Section>

              {/* COMPLAINTS */}
              <Section title={`📣 Complaints filed (${data.complaints.length})`}>
                {data.complaints.length === 0 ? (
                  <div style={emptyStyle}>No complaints filed.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {data.complaints.map(c => (
                      <div key={c._id} style={subCardStyle}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 800, color: '#0f172a' }}>
                            {c.targetType === 'shop' && c.shopId?.name ? `🏪 ${c.shopId.name}` : c.targetType === 'app' ? '📱 App' : `🛒 ${c.itemName || 'Item'}`}
                          </span>
                          <span style={complaintStatusStyle(c.status)}>{c.status}</span>
                        </div>
                        <div style={{ color: '#475569', fontSize: '0.9rem', marginBottom: 4 }}>{c.message}</div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700 }}>
                          {fmtDate(c.createdAt)} · {c.replies?.length || 0} replies
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Section>

              {/* PARCHIS */}
              {data.parchis.length > 0 && (
                <Section title={`🧾 Parchis uploaded (${data.parchis.length})`}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {data.parchis.map(p => (
                      <div key={p._id} style={{ ...subCardStyle, width: 'auto', padding: '8px 10px', fontSize: '0.78rem', color: '#475569', fontWeight: 700 }}>
                        {fmtDate(p.createdAt)} · {p.status}
                      </div>
                    ))}
                  </div>
                </Section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Section + small primitives ---
const Section = ({ title, children }) => (
  <section style={sectionStyle}>
    <h4 style={sectionTitleStyle}>{title}</h4>
    {children}
  </section>
);
const KV = ({ label, value, wide }) => (
  <div style={{ gridColumn: wide ? '1 / -1' : 'auto' }}>
    <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</div>
    <div style={{ fontSize: '0.92rem', color: '#0f172a', fontWeight: 700, marginTop: 2, wordBreak: 'break-word' }}>{value}</div>
  </div>
);
const Stat = ({ label, value, accent }) => (
  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 14px' }}>
    <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</div>
    <div style={{ fontSize: '1.25rem', color: accent, fontWeight: 900, marginTop: 4 }}>{value}</div>
  </div>
);

// --- Styles ---
const overlayStyle = {
  position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(2px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 12,
};
const modalStyle = {
  background: '#fff', borderRadius: 16, width: '100%', maxWidth: 800, maxHeight: '92vh',
  display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 70px rgba(15,23,42,0.3)',
};
const headerStyle = {
  padding: '14px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex',
  alignItems: 'center', justifyContent: 'space-between', gap: 12, flexShrink: 0,
};
const avatarStyle = {
  width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #16a34a, #15803d)',
  color: '#fff', fontWeight: 900, fontSize: '1.1rem', display: 'inline-flex',
  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
};
const closeBtnStyle = {
  background: '#f1f5f9', border: 'none', width: 36, height: 36, borderRadius: '50%',
  fontSize: '1rem', cursor: 'pointer', color: '#475569', fontWeight: 800, flexShrink: 0,
};
const bodyStyle = {
  overflowY: 'auto', padding: '14px 18px 24px', display: 'flex', flexDirection: 'column', gap: 18,
};
const sectionStyle = { display: 'flex', flexDirection: 'column', gap: 10 };
const sectionTitleStyle = { margin: 0, fontSize: '0.78rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' };
const kvGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, background: '#f8fafc', border: '1px solid #e2e8f0', padding: 14, borderRadius: 12 };
const statsGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 };
const emptyStyle = { background: '#f8fafc', border: '1px dashed #e2e8f0', padding: 16, borderRadius: 12, textAlign: 'center', color: '#94a3b8', fontWeight: 700, fontSize: '0.9rem' };
const subLabelStyle = { fontSize: '0.72rem', color: '#64748b', fontWeight: 800, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' };
const chipRowStyle = { display: 'flex', flexWrap: 'wrap', gap: 6 };
const chipStyle = (bg, fg) => ({ background: bg, color: fg, padding: '5px 11px', borderRadius: 999, fontSize: '0.8rem', fontWeight: 800 });
const pillRowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12 };
const pillLabelStyle = { fontSize: '0.78rem', color: '#64748b', fontWeight: 800 };
const pillValueStyle = { fontSize: '0.88rem', color: '#0f172a', fontWeight: 800 };
const orderCardStyle = (isCancel) => ({ background: '#fff', border: `1px solid ${isCancel ? '#fecaca' : '#e2e8f0'}`, borderRadius: 12, overflow: 'hidden' });
const orderHeadBtnStyle = { width: '100%', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' };
const orderBodyStyle = { padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.85rem', color: '#0f172a' };
const lineItemStyle = { display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' };
const statusPillStyle = (isCancel) => ({ background: isCancel ? '#fee2e2' : '#dcfce7', color: isCancel ? '#991b1b' : '#166534', padding: '3px 9px', borderRadius: 999, fontSize: '0.7rem', fontWeight: 800, whiteSpace: 'nowrap' });
const subCardStyle = { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 10 };
const complaintStatusStyle = (status) => {
  const map = { open: ['#fef3c7', '#92400e'], reviewed: ['#dbeafe', '#1e40af'], resolved: ['#dcfce7', '#166534'] };
  const [bg, fg] = map[status] || map.open;
  return { background: bg, color: fg, padding: '3px 9px', borderRadius: 999, fontSize: '0.7rem', fontWeight: 800, textTransform: 'capitalize' };
};

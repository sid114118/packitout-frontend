import React, { useEffect, useMemo, useState } from 'react';
import { useToast, useConfirm } from './ui/DialogProvider.jsx';
import NotificationBell from './NotificationBell';
import ReceiptModal from './components/UserDashboard/ReceiptModal';
import OrderReviewModal from './components/UserDashboard/OrderReviewModal';
import { cdnImage } from './utils/cloudinaryUrl.js';

const BASE_URL = (import.meta.env.VITE_API_BASE || "https://darkslategrey-snail-415133.hostingersite.com");

const stageOf = (status) => {
  const s = (status || "").toLowerCase();
  if (s.includes("cancel")) return "cancelled";
  if (s.includes("deliver") || s.includes("✅") || s.includes("🎉") || s.includes("done")) return "delivered";
  if (s.includes("ready")) return "ready";
  if (s.includes("pack")) return "packing";
  return "pending";
};

const isLive = (o) => {
  const st = stageOf(o.status);
  return st !== "delivered" && st !== "cancelled";
};

const itemToCartProduct = (item) => ({
  _id: item.productId?._id || item.productId || item._id,
  name: item.name || item.product?.name || "Item",
  brand: item.brand || item.product?.brand || "",
  image: item.image || item.product?.image || "",
  emoji: item.emoji || item.product?.emoji || "🛒",
  qnty: item.qnty || item.product?.qnty || "1 unit",
  mrp: Number(item.mrp || item.price || item.product?.mrp || 0),
  sellingPrice: Number(item.sellingPrice || item.price || item.product?.sellingPrice || item.product?.mrp || 0),
});

const fmtINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const TABS = [
  { key: 'all',       label: 'All' },
  { key: 'live',      label: 'Live' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function OrdersPage({ user, onExit, onAddToCart }) {
  const triggerToast = useToast();
  const askConfirm = useConfirm();

  const cacheKey = `packitout_orders_cache_v1_${user._id}`;
  const initialCache = (() => {
    try {
      const raw = localStorage.getItem(cacheKey);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  })();

  const [orders, setOrders] = useState(Array.isArray(initialCache) ? initialCache : []);
  const [loading, setLoading] = useState(initialCache ? false : true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderToReview, setOrderToReview] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQ, setSearchQ] = useState('');

  const fetchOrders = () => {
    // Only show the skeleton on first-ever load. Returning visits paint
    // instantly from cache and refresh silently in the background.
    if (!initialCache) setLoading(true);
    fetch(`${BASE_URL}/orders/user/${user._id}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        const myOrders = (Array.isArray(data) ? data : [])
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setOrders(myOrders);
        setLoading(false);
        try { localStorage.setItem(cacheKey, JSON.stringify(myOrders)); } catch {}
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, [user._id]);

  const initiateCancel = async (orderId) => {
    const ok = await askConfirm({
      title: 'Cancel order?',
      message: 'Are you sure? This action cannot be undone.',
      confirmText: 'Cancel order',
      cancelText: 'Keep order',
      danger: true,
    });
    if (!ok) return;
    try {
      const res = await fetch(`${BASE_URL}/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Cancelled ❌" })
      });
      if (res.ok) {
        triggerToast("Order cancelled successfully!");
        fetchOrders();
      } else {
        triggerToast("Could not cancel. Order is in process.", "error");
      }
    } catch (err) {
      triggerToast("Network error. Try again.", "error");
    }
  };

  const handleReorderItem = (item) => {
    if (!onAddToCart) return;
    const product = itemToCartProduct(item);
    if (!product._id) {
      triggerToast("Couldn't add this item — try again.", "error");
      return;
    }
    onAddToCart(product);
    triggerToast(`${product.name} added to cart 🛒`);
  };

  // ── DERIVED ──────────────────────────────────────────────
  const counts = useMemo(() => {
    const live = orders.filter(isLive).length;
    const delivered = orders.filter(o => stageOf(o.status) === 'delivered').length;
    const cancelled = orders.filter(o => stageOf(o.status) === 'cancelled').length;
    return { all: orders.length, live, delivered, cancelled };
  }, [orders]);

  const stats = useMemo(() => {
    const totalSpent = orders
      .filter(o => stageOf(o.status) !== 'cancelled')
      .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

    const shopFreq = new Map();
    orders.forEach(o => {
      const name = o.shopId?.name;
      if (!name) return;
      shopFreq.set(name, (shopFreq.get(name) || 0) + 1);
    });
    let favShop = '—';
    let favCount = 0;
    shopFreq.forEach((c, name) => { if (c > favCount) { favCount = c; favShop = name; } });

    return { totalSpent, favShop, total: orders.length };
  }, [orders]);

  const frequentItems = useMemo(() => {
    const map = new Map();
    orders.forEach(o => {
      if (stageOf(o.status) === 'cancelled') return;
      (o.items || []).forEach(item => {
        const id = item.productId?._id || item.productId || item._id;
        if (!id) return;
        const key = String(id);
        const prev = map.get(key);
        if (prev) {
          prev.count += Number(item.qty || 1);
        } else {
          map.set(key, { item, count: Number(item.qty || 1) });
        }
      });
    });
    return Array.from(map.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [orders]);

  const filtered = useMemo(() => {
    let list = orders;
    if (activeTab === 'live') list = list.filter(isLive);
    else if (activeTab === 'delivered') list = list.filter(o => stageOf(o.status) === 'delivered');
    else if (activeTab === 'cancelled') list = list.filter(o => stageOf(o.status) === 'cancelled');

    const q = searchQ.trim().toLowerCase();
    if (!q) return list;
    return list.filter(o => {
      const shopMatch = (o.shopId?.name || '').toLowerCase().includes(q);
      const itemMatch = (o.items || []).some(it => (it.name || '').toLowerCase().includes(q));
      const idMatch = (o._id || '').toLowerCase().includes(q);
      return shopMatch || itemMatch || idMatch;
    });
  }, [orders, activeTab, searchQ]);

  // ── RENDER ───────────────────────────────────────────────
  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '90px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <style>{`
        @keyframes opShimmer { 0% { background-position: -200px 0; } 100% { background-position: 200px 0; } }
        .op-skel { background: linear-gradient(90deg, #f1f5f9 0px, #e2e8f0 40px, #f1f5f9 80px); background-size: 400px 100%; animation: opShimmer 1.2s linear infinite; border-radius: 10px; }
        .op-press:active { transform: scale(0.97); }
        .op-press { transition: transform 0.12s ease; }
        .op-hide-scroll::-webkit-scrollbar { display: none; }
        .op-hide-scroll { scrollbar-width: none; }
        @keyframes opFade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .op-fade { animation: opFade 0.25s ease-out; }
      `}</style>

      {/* ── CORAL HEADER (matches Upload Parchi) ───────── */}
      <div style={{
        background: 'linear-gradient(135deg, #ff6b6b 0%, #ff4757 100%)',
        padding: '14px 18px 56px',
        color: '#fff',
        borderBottomLeftRadius: '28px',
        borderBottomRightRadius: '28px',
        boxShadow: '0 14px 32px rgba(255, 71, 87, 0.32)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div aria-hidden="true" style={{ position: 'absolute', top: '-80px', right: '-60px', width: '220px', height: '220px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.30), rgba(255,255,255,0) 70%)', pointerEvents: 'none' }} />
        <div aria-hidden="true" style={{ position: 'absolute', bottom: '20px', left: '-50px', width: '180px', height: '180px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.18), rgba(255,255,255,0) 70%)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
          <button
            onClick={onExit}
            aria-label="Back to shop"
            className="op-press"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: 'rgba(255,255,255,0.08)', color: '#fff',
              border: '1px solid rgba(255,255,255,0.12)',
              padding: '8px 14px 8px 10px', borderRadius: '999px',
              fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
              backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Shop
          </button>
          <NotificationBell ownerType="user" ownerId={user._id} />
        </div>

        <div style={{ marginTop: '20px', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.78)', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>
            Your Orders
          </div>
          <h2 style={{ margin: '4px 0 0', fontSize: '1.6rem', fontWeight: 900, letterSpacing: '-0.4px' }}>
            {orders.length > 0 ? `${orders.length} order${orders.length === 1 ? '' : 's'}` : 'No orders yet'}
          </h2>
          {orders.length > 0 && (
            <div style={{ marginTop: '4px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.88)', fontWeight: 600 }}>
              You've spent <span style={{ color: '#fff', fontWeight: 800 }}>{fmtINR(stats.totalSpent)}</span> with PackItOut
            </div>
          )}
        </div>
      </div>

      {/* ── CONTENT PULLED UP ───────────────────────────── */}
      <div style={{ padding: '0 14px', maxWidth: '600px', margin: '0 auto', marginTop: '-36px', position: 'relative', zIndex: 2 }}>

        {/* STATS STRIP */}
        {orders.length > 0 && (
          <div style={{
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: '20px',
            boxShadow: '0 12px 28px rgba(15,23,42,0.10)',
            padding: '14px', display: 'grid',
            gridTemplateColumns: '1fr 1px 1fr 1px 1fr',
            gap: '8px', alignItems: 'center', marginBottom: '14px',
          }}>
            <Stat label="Orders" value={stats.total} icon="📦" />
            <div style={{ width: '1px', height: '38px', background: '#e2e8f0' }} />
            <Stat label="Total spent" value={fmtINR(stats.totalSpent)} icon="💰" small />
            <div style={{ width: '1px', height: '38px', background: '#e2e8f0' }} />
            <Stat label="Favourite shop" value={stats.favShop} icon="🏪" small ellipsis />
          </div>
        )}

        {/* SEARCH */}
        {orders.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            background: '#fff', borderRadius: '14px', padding: '11px 14px',
            border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
            marginBottom: '12px',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search by shop or item…"
              style={{
                flex: 1, border: 'none', outline: 'none', background: 'transparent',
                fontSize: '0.92rem', fontWeight: 500, color: '#0f172a',
              }}
            />
            {searchQ && (
              <button
                onClick={() => setSearchQ('')}
                aria-label="Clear search"
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '999px', padding: '4px 8px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', cursor: 'pointer' }}
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* TABS */}
        {orders.length > 0 && (
          <div className="op-hide-scroll" style={{
            display: 'flex', gap: '8px', overflowX: 'auto',
            marginBottom: '14px', paddingBottom: '2px',
          }}>
            {TABS.map(t => {
              const active = activeTab === t.key;
              const n = counts[t.key] ?? 0;
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className="op-press"
                  style={{
                    flexShrink: 0,
                    padding: '8px 14px',
                    borderRadius: '999px',
                    border: active ? '1px solid #0f172a' : '1px solid #e2e8f0',
                    background: active ? '#0f172a' : '#fff',
                    color: active ? '#fff' : '#0f172a',
                    fontWeight: 800, fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    boxShadow: active ? '0 4px 12px rgba(15,23,42,0.18)' : 'none',
                  }}
                >
                  {t.label}
                  <span style={{
                    background: active ? 'rgba(255,255,255,0.18)' : '#f1f5f9',
                    color: active ? '#fff' : '#475569',
                    padding: '1px 8px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 800,
                  }}>{n}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* BUY AGAIN SHELF */}
        {frequentItems.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.05rem', fontWeight: 900, letterSpacing: '-0.2px' }}>
                Buy again ↻
              </h3>
              <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>Tap + to add</span>
            </div>
            <div className="op-hide-scroll" style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
              {frequentItems.map(({ item, count }, i) => {
                const product = itemToCartProduct(item);
                return (
                  <div key={i} style={{
                    flexShrink: 0, width: '128px',
                    background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px',
                    padding: '10px', position: 'relative',
                    boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
                  }}>
                    <div style={{
                      height: '70px', borderRadius: '10px',
                      background: product.image ? '#f8fafc' : 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.6rem', marginBottom: '8px', overflow: 'hidden',
                    }}>
                      {product.image
                        ? <img src={cdnImage(product.image, 200)} alt={product.name} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span>{product.emoji || '🛒'}</span>}
                    </div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.25, height: '34px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {product.name}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 900, color: '#0f172a' }}>{fmtINR(product.sellingPrice)}</span>
                      <button
                        onClick={() => handleReorderItem(item)}
                        aria-label={`Add ${product.name}`}
                        className="op-press"
                        style={{
                          background: '#16a34a', color: '#fff', border: 'none',
                          width: '26px', height: '26px', borderRadius: '8px',
                          fontWeight: 900, fontSize: '1rem', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: '0 4px 10px rgba(22,163,74,0.32)',
                        }}
                      >+</button>
                    </div>
                    {count > 1 && (
                      <div style={{
                        position: 'absolute', top: '6px', right: '6px',
                        background: 'rgba(15,23,42,0.85)', color: '#fff',
                        fontSize: '0.62rem', fontWeight: 800,
                        padding: '2px 6px', borderRadius: '999px',
                      }}>×{count}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* LIST HEADER */}
        {orders.length > 0 && (
          <h3 style={{ margin: '0 4px 12px', color: '#0f172a', fontSize: '1.05rem', fontWeight: 900, letterSpacing: '-0.2px' }}>
            {activeTab === 'all' ? 'All orders' : TABS.find(t => t.key === activeTab)?.label + ' orders'}
            <span style={{ marginLeft: '8px', color: '#94a3b8', fontWeight: 700, fontSize: '0.85rem' }}>({filtered.length})</span>
          </h3>
        )}

        {/* LOADING / EMPTY / LIST */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="op-skel" style={{ height: '120px', borderRadius: '18px' }} />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <EmptyState onExit={onExit} />
        ) : filtered.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: '16px', padding: '32px 20px', textAlign: 'center', border: '1px dashed #cbd5e1' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔍</div>
            <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>No matching orders</div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
              Try a different search or switch tabs.
            </div>
          </div>
        ) : (
          <div className="op-fade" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                onOpen={() => setSelectedOrder(order)}
                onCancel={() => initiateCancel(order._id)}
                onReview={() => { setOrderToReview(order); setIsReviewModalOpen(true); }}
                onReorderItem={handleReorderItem}
              />
            ))}
          </div>
        )}
      </div>

      {/* MODALS */}
      <ReceiptModal
        selectedOrder={selectedOrder}
        setSelectedOrder={setSelectedOrder}
        onReorderItem={handleReorderItem}
      />
      <OrderReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        order={orderToReview}
        onSubmitReviews={() => triggerToast("Feedback received!")}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────
function Stat({ label, value, icon, small, ellipsis }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, padding: '0 2px' }}>
      <div style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ fontSize: '0.9rem' }}>{icon}</span>
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
      </div>
      <div
        title={ellipsis ? value : undefined}
        style={{
          fontSize: small ? '0.92rem' : '1.15rem',
          fontWeight: 900, color: '#0f172a',
          marginTop: '3px', letterSpacing: '-0.3px',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
        {value}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
function OrderCard({ order, onOpen, onCancel, onReview, onReorderItem }) {
  const stage = stageOf(order.status);
  const live = stage !== 'delivered' && stage !== 'cancelled';
  const isPending = stage === 'pending';
  const isDelivered = stage === 'delivered';
  const isCancelled = stage === 'cancelled';
  const isReady = stage === 'ready';

  const accentColor = isCancelled ? '#94a3b8' : isDelivered ? '#16a34a' : isReady ? '#10b981' : '#ef4444';
  const badgeBg = isCancelled ? '#f1f5f9' : isDelivered ? '#ecfdf5' : isReady ? '#ecfdf5' : '#fef2f2';
  const badgeFg = isCancelled ? '#64748b' : isDelivered ? '#15803d' : isReady ? '#10b981' : '#ef4444';
  const badgeBorder = isCancelled ? '#e2e8f0' : isDelivered ? '#d1fae5' : isReady ? '#d1fae5' : '#fee2e2';

  const items = Array.isArray(order.items) ? order.items : [];
  const previewItems = items.slice(0, 3);
  const extraCount = items.length - previewItems.length;
  const createdAt = order.createdAt ? new Date(order.createdAt) : null;

  return (
    <div
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onOpen(); }}
      className="op-press"
      style={{
        background: '#fff', padding: '14px', borderRadius: '18px',
        boxShadow: '0 4px 14px rgba(15,23,42,0.05)',
        border: '1px solid #f1f5f9',
        position: 'relative', cursor: 'pointer', overflow: 'hidden',
      }}
    >
      {/* Accent strip */}
      <div style={{ position: 'absolute', top: 0, left: '20px', width: '40px', height: '3px', background: accentColor, borderBottomLeftRadius: '4px', borderBottomRightRadius: '4px' }} />

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginTop: '4px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.66rem', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.6px' }}>
            ORDER #{(order._id || '').slice(-5).toUpperCase()}
          </div>
          <h4 style={{ margin: '2px 0 0', color: '#0f172a', fontSize: '1.05rem', fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.2px' }}>
            {order.shopId?.name || "Local shop"}
          </h4>
          {createdAt && (
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>
              {createdAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · {createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>
        <div style={{
          background: badgeBg, color: badgeFg,
          padding: '5px 11px', borderRadius: '999px',
          fontWeight: 800, fontSize: '0.74rem', whiteSpace: 'nowrap',
          border: `1px solid ${badgeBorder}`,
          display: 'inline-flex', alignItems: 'center', gap: '5px',
          flexShrink: 0,
        }}>
          {live && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: accentColor, boxShadow: `0 0 0 3px ${accentColor}22` }} />}
          {order.status || 'Pending'}
        </div>
      </div>

      {/* Items preview with per-item reorder */}
      {previewItems.length > 0 && (
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {previewItems.map((it, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '10px',
                background: it.image ? '#f8fafc' : 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.1rem', overflow: 'hidden', flexShrink: 0,
              }}>
                {it.image
                  ? <img src={cdnImage(it.image, 120)} alt="" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span>{it.emoji || '🛒'}</span>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {it.name || 'Item'}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                  ×{it.qty || 1} · {fmtINR(it.price || it.sellingPrice || 0)}
                </div>
              </div>
              {!isCancelled && (
                <button
                  onClick={(e) => { e.stopPropagation(); onReorderItem(it); }}
                  aria-label={`Reorder ${it.name}`}
                  className="op-press"
                  style={{
                    background: '#fff', color: '#16a34a',
                    border: '1px solid #bbf7d0',
                    padding: '5px 12px', borderRadius: '10px',
                    fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    flexShrink: 0,
                  }}
                >
                  ↻ Buy
                </button>
              )}
            </div>
          ))}
          {extraCount > 0 && (
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, paddingLeft: '44px' }}>
              + {extraCount} more item{extraCount === 1 ? '' : 's'}
            </div>
          )}
        </div>
      )}

      {/* Footer row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', marginTop: '12px', borderTop: '1px dashed #f1f5f9' }}>
        <div style={{ fontSize: '0.88rem', color: '#475569', fontWeight: 700 }}>
          <span style={{ color: '#0f172a', fontWeight: 900 }}>{items.length}</span> item{items.length === 1 ? '' : 's'} · <span style={{ color: '#0f172a', fontWeight: 900 }}>{fmtINR(order.totalAmount)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isPending && (
            <button
              onClick={(e) => { e.stopPropagation(); onCancel(); }}
              className="op-press"
              style={{ background: '#fff', color: '#64748b', border: '1px solid #e2e8f0', padding: '6px 11px', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}
            >
              Cancel
            </button>
          )}
          {order.shopId?.phone && (
            <a
              href={`tel:${order.shopId.phone}`}
              onClick={(e) => e.stopPropagation()}
              aria-label="Call shop"
              className="op-press"
              style={{ background: '#f8fafc', color: '#0f172a', padding: '6px 10px', borderRadius: '10px', textDecoration: 'none', fontSize: '0.78rem', fontWeight: 800, border: '1px solid #e2e8f0', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              📞
            </a>
          )}
          {isDelivered && !order.isReviewed && (
            <button
              onClick={(e) => { e.stopPropagation(); onReview(); }}
              className="op-press"
              style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '6px 11px', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}
            >
              ⭐ Rate
            </button>
          )}
          <button
            className="op-press"
            style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
          >
            Bill ›
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
function EmptyState({ onExit }) {
  return (
    <div style={{
      background: '#fff', borderRadius: '20px', padding: '36px 24px',
      textAlign: 'center', border: '1px solid #e2e8f0',
      boxShadow: '0 4px 14px rgba(15,23,42,0.04)',
    }}>
      <div style={{
        width: '74px', height: '74px', margin: '0 auto 14px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '2.2rem',
      }}>🛍️</div>
      <h3 style={{ margin: '0 0 6px', fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>No orders yet</h3>
      <p style={{ margin: '0 0 18px', fontSize: '0.88rem', color: '#64748b', fontWeight: 500, lineHeight: 1.5 }}>
        Your orders, receipts and quick re-orders will appear here once you place your first one.
      </p>
      <button
        onClick={onExit}
        className="op-press"
        style={{
          padding: '12px 22px',
          background: 'linear-gradient(135deg, #16a34a, #15803d)',
          color: '#fff', border: 'none', borderRadius: '12px',
          fontWeight: 800, fontSize: '0.92rem', cursor: 'pointer',
          boxShadow: '0 8px 22px rgba(22, 163, 74, 0.28)',
        }}
      >
        Start shopping →
      </button>
    </div>
  );
}

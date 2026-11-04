import React, { useState, useEffect } from 'react';
import { BASE_URL } from './utils/api.js';
import { cdnImage } from './utils/cloudinaryUrl.js';
import { useToast } from './ui/DialogProvider.jsx';

export default function PosBillView({ orderId, onSetCartAndGo, onGoToShopStore }) {
  const toast = useToast();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const fetchBill = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${BASE_URL}/public/bill/${orderId}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (!cancelled) setError(data.error || 'Could not load digital receipt.');
        } else if (!cancelled) {
          setBill(data);
          // 🌟 Offline-to-Online Magic: Automatically bind this shop as the visitor's active online store!
          if (data.shop && data.shop._id) {
            try {
              localStorage.setItem('packitout_guest_shop_id', String(data.shop._id));
              if (data.shop.name) localStorage.setItem('packitout_guest_shop_name', data.shop.name);
              if (data.shop.pincode) localStorage.setItem('packitout_guest_pincode', data.shop.pincode);
              window.dispatchEvent(
                new CustomEvent('PACKITOUT_SHOP_CHANGED', {
                  detail: {
                    shopId: String(data.shop._id),
                    pincode: data.shop.pincode || '',
                    shopName: data.shop.name || '',
                  },
                })
              );
            } catch (e) { /* storage blocked */ }
          }
        }
      } catch (err) {
        if (!cancelled) setError('Network error while loading your digital receipt.');
      }
      if (!cancelled) setLoading(false);
    };
    if (orderId) fetchBill();
    return () => { cancelled = true; };
  }, [orderId]);

  const handleOneTapReorder = () => {
    if (!bill || !Array.isArray(bill.items)) return;
    const shopId = bill.shop?._id || '';
    const reorderItems = bill.items
      .filter(it => it && !it.isCustomItem && !it.isCustomNote && it.productId && !String(it.productId).startsWith('pos_custom_'))
      .map(it => ({
        _id: String(it.productId),
        name: it.name,
        brand: it.brand || '',
        image: it.image || '',
        emoji: it.emoji || '🛒',
        qnty: it.qnty || '',
        mrp: Number(it.mrp || it.price || 0),
        sellingPrice: Number(it.sellingPrice || it.price || 0),
        qty: Math.max(1, Number(it.qty) || 1),
        shopId,
      }));

    if (reorderItems.length === 0) {
      toast('Opening online store so you can browse items!', 'info');
      handleBrowseOnlineStore();
      return;
    }

    if (onSetCartAndGo) {
      onSetCartAndGo(reorderItems, shopId, bill.shop?.pincode || '');
    } else {
      window.location.hash = '#cart';
    }
  };

  const handleBrowseOnlineStore = () => {
    const shopId = bill?.shop?._id;
    const pin = bill?.shop?.pincode || '';
    if (onGoToShopStore && shopId) {
      onGoToShopStore(shopId, pin, bill?.shop);
      return;
    }
    if (shopId) {
      window.location.hash = `#/s/${shopId}${pin ? `?pin=${pin}` : ''}`;
    } else {
      window.location.hash = '';
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#f8fafc', fontFamily: 'sans-serif' }}>
        <div className="pio-spinner" />
        <p style={{ marginTop: '14px', color: '#475569', fontWeight: 700 }}>Loading your Digital Receipt…</p>
      </div>
    );
  }

  if (error || !bill) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#f8fafc', fontFamily: 'sans-serif', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🧾</div>
        <h2 style={{ margin: '0 0 8px', color: '#0f172a' }}>Receipt Unavailable</h2>
        <p style={{ color: '#64748b', maxWidth: '340px', marginBottom: '20px' }}>{error || 'We could not find this bill.'}</p>
        <button
          onClick={() => { window.location.hash = ''; }}
          style={{ padding: '12px 24px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}
        >
          Go to Online Store
        </button>
      </div>
    );
  }

  const shop = bill.shop || {};
  const items = Array.isArray(bill.items) ? bill.items : [];
  const totalQty = items.reduce((s, i) => s + (Number(i?.qty) || 1), 0);
  const isPaid = bill.paymentStatus === 'Paid' || bill.paymentStatus === 'Success';
  const payMethod = String(bill.paymentMethod || 'CASH').toUpperCase();

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 220px, #f1f5f9 220px)', padding: '20px 14px 100px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '520px', margin: '0 auto' }}>

        {/* TOP BAR */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', color: '#fff' }}>
          <button
            onClick={handleBrowseOnlineStore}
            style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 14px', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
          >
            ← Visit {shop.name || 'Store'} Online
          </button>
          <button
            onClick={() => window.print()}
            style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 14px', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
          >
            🖨️ Print / Save PDF
          </button>
        </div>

        {/* RECEIPT CARD */}
        <div style={{ background: '#ffffff', borderRadius: '22px', overflow: 'hidden', boxShadow: '0 20px 45px rgba(15, 23, 42, 0.16)', border: '1px solid #e2e8f0' }}>

          {/* STORE BANNER */}
          <div style={{ background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)', color: '#fff', padding: '22px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fff', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #34d399' }}>
                {shop.shopImage ? (
                  <img src={cdnImage(shop.shopImage, 160)} alt={shop.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '1.5rem' }}>🏪</span>
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#a7f3d0', fontWeight: 800 }}>
                  ✅ Verified Digital Receipt
                </div>
                <h1 style={{ margin: '2px 0 4px', fontSize: '1.25rem', fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {shop.name || 'Local Store'}
                </h1>
                <div style={{ fontSize: '0.78rem', color: '#d1fae5' }}>
                  {shop.fullAddress ? `${shop.fullAddress} (${shop.pincode || ''})` : `Pincode: ${shop.pincode || '—'}`}
                </div>
                {shop.phone && (
                  <div style={{ fontSize: '0.76rem', color: '#a7f3d0', marginTop: '2px' }}>
                    📞 {shop.phone} {shop.gst ? `• GST: ${shop.gst}` : ''}
                  </div>
                )}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ background: 'rgba(255,255,255,0.18)', padding: '6px 10px', borderRadius: '10px', fontWeight: 900, fontSize: '0.9rem' }}>
                #{bill.shortId}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#d1fae5', marginTop: '4px' }}>
                {bill.orderSource === 'POS' ? '⚡ Counter Bill' : '🛒 Online Order'}
              </div>
            </div>
          </div>

          {/* CUSTOMER & PAYMENT META */}
          <div style={{ padding: '14px 20px', background: '#f8fafc', borderBottom: '1px dashed #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>BILLED TO</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                👤 {bill.customerName} {bill.customerPhone ? `(${bill.customerPhone})` : ''}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                🕒 {new Date(bill.createdAt).toLocaleString()}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{
                display: 'inline-block',
                padding: '6px 12px',
                borderRadius: '999px',
                fontWeight: 800,
                fontSize: '0.8rem',
                background: isPaid ? '#dcfce7' : '#fef3c7',
                color: isPaid ? '#15803d' : '#b45309',
                border: `1px solid ${isPaid ? '#86efac' : '#fde68a'}`,
              }}>
                {isPaid ? `✅ Paid (${payMethod})` : `⏳ ${payMethod === 'KHATA' ? 'Khata Due' : 'Payment Pending'}`}
              </span>
            </div>
          </div>

          {/* 🎉 SAVINGS & LOYALTY COINS REWARD BANNER */}
          {(bill.savingsAmount > 0 || bill.coinsEarned > 0) && (
            <div style={{ margin: '16px 20px 0', padding: '12px 14px', borderRadius: '14px', background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', border: '1px solid #6ee7b7', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {bill.savingsAmount > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.35rem' }}>🎉</span>
                  <div>
                    <div style={{ fontWeight: 900, color: '#065f46', fontSize: '0.9rem' }}>
                      You Saved ₹{bill.savingsAmount} on MRP!
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#047857' }}>
                      Special store prices applied on your bill
                    </div>
                  </div>
                </div>
              )}
              {bill.coinsEarned > 0 && (
                <div style={{ background: '#ffffff', padding: '6px 12px', borderRadius: '10px', border: '1px solid #34d399', textAlign: 'right' }}>
                  <div style={{ fontWeight: 900, color: '#d97706', fontSize: '0.84rem' }}>
                    🪙 +{bill.coinsEarned} Loyalty Coins!
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#475569', fontWeight: 600 }}>
                    Wallet: {bill.customerCoinsBalance} Coins
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ITEMIZED TABLE */}
          <div style={{ padding: '18px 20px' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Itemized Summary ({items.length} items • {totalQty} units)</span>
              <span>Amount</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {items.map((item, idx) => {
                const qty = Number(item.qty) || 1;
                const price = Number(item.price ?? item.sellingPrice ?? item.mrp ?? 0);
                const mrp = Number(item.mrp ?? price);
                const lineTotal = Math.round(price * qty * 100) / 100;
                const lineMrp = Math.round(mrp * qty * 100) / 100;
                return (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                      {item.image ? (
                        <img src={cdnImage(item.image, 80)} alt={item.name} style={{ width: '38px', height: '38px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e2e8f0', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                          {item.emoji || '🛍️'}
                        </div>
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '2px' }}>
                          {qty} × ₹{price} {item.qnty && item.qnty !== '1 unit' ? `• ${item.qnty}` : ''}
                          {mrp > price && (
                            <span style={{ marginLeft: '6px', color: '#16a34a', fontWeight: 700 }}>
                              (MRP ₹{mrp})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>
                        ₹{lineTotal}
                      </div>
                      {lineMrp > lineTotal && (
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                          ₹{lineMrp}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* TOTALS BREAKDOWN */}
            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '2px dashed #cbd5e1', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {bill.mrpTotal > bill.totalAmount && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: '#64748b' }}>
                  <span>Total MRP Value</span>
                  <span style={{ textDecoration: 'line-through' }}>₹{bill.mrpTotal}</span>
                </div>
              )}
              {bill.discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: '#16a34a', fontWeight: 700 }}>
                  <span>🏷️ Extra Discount / Coins Used</span>
                  <span>-₹{bill.discountAmount}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '1.08rem', fontWeight: 900, color: '#0f172a' }}>Grand Total</span>
                <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#16a34a' }}>₹{bill.totalAmount}</span>
              </div>
            </div>
          </div>

          {/* 🚀 OFFLINE-TO-ONLINE CONVERSION CTA BOX */}
          <div className="no-print" style={{ margin: '0 16px 18px', padding: '18px', borderRadius: '18px', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#fff', boxShadow: '0 10px 25px rgba(15, 23, 42, 0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <span style={{ fontSize: '1.6rem' }}>📲</span>
              <div>
                <div style={{ fontWeight: 900, fontSize: '1rem', color: '#34d399' }}>
                  Order Online from {shop.name || 'Us'} Next Time!
                </div>
                <div style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: '2px' }}>
                  Skip the counter wait! Order from home, upload a handwritten Parchi, or reorder this exact bill in 1 tap.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px' }}>
              <button
                onClick={handleBrowseOnlineStore}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                  color: '#fff',
                  fontWeight: 900,
                  fontSize: '0.96rem',
                  cursor: 'pointer',
                  boxShadow: '0 6px 18px rgba(22, 163, 74, 0.38)',
                }}
              >
                🛒 Open {shop.name || 'Store'}'s Online Store ›
              </button>

              <button
                onClick={handleOneTapReorder}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid rgba(52, 211, 153, 0.5)',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#a7f3d0',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                }}
              >
                🔁 1-Tap Reorder Same Items Online
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'center', padding: '10px 16px 16px', fontSize: '0.74rem', color: '#94a3b8' }}>
            Powered by <strong>PackItOut</strong> • Smart Local Store & Digital Billing
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
        }
      `}</style>
    </div>
  );
}

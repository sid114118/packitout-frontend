import React, { useState, useEffect } from 'react';
import { BASE_URL } from './utils/api.js';
import { cdnImage } from './utils/cloudinaryUrl.js';
import { useToast } from './ui/DialogProvider.jsx';
import { toWhatsAppPhone, getWhatsAppUrl } from './utils/whatsappShare.js';
import { downloadReceiptPdf, downloadReceiptImage } from './utils/billReceiptGenerator.js';

export default function PosBillView({ orderId, onSetCartAndGo, onGoToShopStore }) {
  const toast = useToast();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

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
            } catch {
              /* storage blocked */
            }
          }
        }
      } catch {
        if (!cancelled) setError('Network error while loading your digital receipt.');
      }
      if (!cancelled) setLoading(false);
    };
    if (orderId) fetchBill();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const handleShareReceipt = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator
        .share({
          title: `${bill?.shop?.name || 'Store'} Digital Bill #${bill?.shortId || ''}`,
          text: `Here is my digital bill for ₹${bill?.totalAmount || ''} from ${bill?.shop?.name || 'our local store'}!`,
          url,
        })
        .catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      toast('Receipt link copied to clipboard!');
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

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
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
        <div className="pio-spinner" />
        <p style={{ marginTop: '14px', color: '#475569', fontWeight: 800, fontSize: '0.95rem' }}>Loading your Digital Receipt…</p>
      </div>
    );
  }

  if (error || !bill) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#f8fafc', fontFamily: 'system-ui, sans-serif', textAlign: 'center' }}>
        <div style={{ fontSize: '3.4rem', marginBottom: '12px' }}>🧾</div>
        <h2 style={{ margin: '0 0 8px', color: '#0f172a', fontWeight: 900 }}>Receipt Unavailable</h2>
        <p style={{ color: '#64748b', maxWidth: '340px', marginBottom: '20px', lineHeight: 1.5 }}>{error || 'We could not find this bill.'}</p>
        <button
          onClick={() => { window.location.hash = ''; }}
          style={{ padding: '12px 24px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', fontSize: '0.92rem' }}
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
  const cleanShopPhone = toWhatsAppPhone(shop.phone);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #090d16 0%, #1e293b 240px, #f1f5f9 240px)', padding: '20px 14px 100px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '540px', margin: '0 auto' }}>

        {/* TOP BAR ACTION STRIP */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', color: '#fff', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={handleBrowseOnlineStore}
            style={{
              background: 'rgba(255,255,255,0.12)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.22)',
              padding: '8px 14px',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            ← Visit {shop.name || 'Store'} Online
          </button>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={handleShareReceipt}
              style={{
                background: 'rgba(255,255,255,0.12)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.22)',
                padding: '8px 12px',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              {copiedLink ? '✓ Copied' : '🔗 Share'}
            </button>
            <button
              onClick={async () => {
                try {
                  toast('Generating PDF bill…', 'info');
                  await downloadReceiptPdf(bill, bill.shop);
                  toast('📄 PDF Bill Downloaded!', 'success');
                } catch {
                  window.print();
                }
              }}
              style={{
                background: 'rgba(255,255,255,0.12)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.22)',
                padding: '8px 12px',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              📄 PDF Bill
            </button>
            <button
              onClick={() => window.print()}
              style={{
                background: 'rgba(255,255,255,0.12)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.22)',
                padding: '8px 12px',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              🖨️ Print
            </button>
          </div>
        </div>

        {/* RECEIPT CARD */}
        <div style={{ background: '#ffffff', borderRadius: '22px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(15, 23, 42, 0.18)', border: '1px solid #e2e8f0' }}>

          {/* STORE HEADER BANNER */}
          <div style={{ background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)', color: '#fff', padding: '22px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: '#fff', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #34d399' }}>
                {shop.shopImage ? (
                  <img src={cdnImage(shop.shopImage, 160)} alt={shop.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '1.6rem' }}>🏪</span>
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
                  <div style={{ fontSize: '0.74rem', color: '#a7f3d0', marginTop: '2px' }}>
                    📞 {shop.phone} {shop.gst ? `• GST: ${shop.gst}` : ''}
                  </div>
                )}
              </div>
            </div>

            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ background: 'rgba(255,255,255,0.18)', padding: '6px 12px', borderRadius: '10px', fontWeight: 900, fontSize: '0.95rem', letterSpacing: '0.5px' }}>
                #{bill.shortId}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#d1fae5', marginTop: '4px', fontWeight: 700 }}>
                {bill.orderSource === 'POS' ? '⚡ Counter POS' : '🛒 Online Order'}
              </div>
            </div>
          </div>

          {/* STORE CONTACT PILLS */}
          {shop.phone && (
            <div className="no-print" style={{ display: 'flex', gap: '8px', padding: '10px 20px', background: '#ecfdf5', borderBottom: '1px solid #d1fae5', flexWrap: 'wrap' }}>
              <a
                href={`tel:${shop.phone}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '5px 12px',
                  borderRadius: '999px',
                  background: '#fff',
                  border: '1px solid #a7f3d0',
                  color: '#065f46',
                  fontWeight: 800,
                  fontSize: '0.74rem',
                  textDecoration: 'none',
                }}
              >
                📞 Call Shop
              </a>
              {cleanShopPhone && (
                <a
                  href={getWhatsAppUrl(cleanShopPhone, `Namaste ${shop.name || 'Store'} ji, regarding my bill #${bill.shortId}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '5px 12px',
                    borderRadius: '999px',
                    background: '#16a34a',
                    border: '1px solid #15803d',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '0.74rem',
                    textDecoration: 'none',
                  }}
                >
                  💬 WhatsApp Store
                </a>
              )}
            </div>
          )}

          {/* CUSTOMER & PAYMENT META */}
          <div style={{ padding: '14px 20px', background: '#f8fafc', borderBottom: '1px dashed #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>BILLED TO</div>
              <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#0f172a' }}>
                👤 {bill.customerName} {bill.customerPhone ? `(${bill.customerPhone})` : ''}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                🕒 {new Date(bill.createdAt).toLocaleString()}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{
                display: 'inline-block',
                padding: '6px 12px',
                borderRadius: '999px',
                fontWeight: 900,
                fontSize: '0.78rem',
                background: isPaid ? '#dcfce7' : '#fef3c7',
                color: isPaid ? '#15803d' : '#b45309',
                border: `1px solid ${isPaid ? '#86efac' : '#fde68a'}`,
              }}>
                {isPaid ? `✅ Paid (${payMethod})` : `⏳ ${payMethod === 'KHATA' ? 'Khata Due' : 'Payment Pending'}`}
              </span>
            </div>
          </div>

          {/* 🎉 SAVINGS & LOYALTY COINS BANNER */}
          {(bill.savingsAmount > 0 || bill.coinsEarned > 0) && (
            <div style={{ margin: '14px 20px 0', padding: '12px 14px', borderRadius: '14px', background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', border: '1px solid #6ee7b7', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {bill.savingsAmount > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.4rem' }}>🎉</span>
                  <div>
                    <div style={{ fontWeight: 900, color: '#065f46', fontSize: '0.88rem' }}>
                      You Saved ₹{bill.savingsAmount} on MRP!
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#047857' }}>
                      Special local store prices applied on this bill
                    </div>
                  </div>
                </div>
              )}
              {bill.coinsEarned > 0 && (
                <div style={{ background: '#ffffff', padding: '6px 12px', borderRadius: '10px', border: '1px solid #34d399', textAlign: 'right' }}>
                  <div style={{ fontWeight: 900, color: '#d97706', fontSize: '0.82rem' }}>
                    🪙 +{bill.coinsEarned} Loyalty Coins!
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#475569', fontWeight: 600 }}>
                    Balance: {bill.customerCoinsBalance} Coins
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ITEMIZED TABLE */}
          <div style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Items ({items.length} items • {Math.round(totalQty * 100) / 100} units)</span>
              <span>Amount</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {items.map((item, idx) => {
                const qty = Number(item.qty) || 1;
                const price = Number(item.price ?? item.sellingPrice ?? item.mrp ?? 0);
                const mrp = Number(item.mrp ?? price);
                const lineTotal = Math.round(price * qty * 100) / 100;
                const lineMrp = Math.round(mrp * qty * 100) / 100;
                return (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                      {item.image ? (
                        <img src={cdnImage(item.image, 80)} alt={item.name} style={{ width: '38px', height: '38px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e2e8f0', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                          {item.emoji || '🛍️'}
                        </div>
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '1px' }}>
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
                      <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '0.94rem' }}>
                        ₹{lineTotal}
                      </div>
                      {lineMrp > lineTotal && (
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                          ₹{lineMrp}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* TOTALS BREAKDOWN */}
            <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '2px dashed #cbd5e1', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {bill.mrpTotal > bill.totalAmount && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#64748b' }}>
                  <span>Total MRP Value</span>
                  <span style={{ textDecoration: 'line-through' }}>₹{bill.mrpTotal}</span>
                </div>
              )}
              {bill.discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#16a34a', fontWeight: 700 }}>
                  <span>🏷️ Extra Discount / Coins Used</span>
                  <span>-₹{bill.discountAmount}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a' }}>Grand Total</span>
                <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#16a34a' }}>₹{bill.totalAmount}</span>
              </div>
            </div>
          </div>

          {/* 📥 OFFICIAL RECEIPT DOWNLOADS */}
          <div className="no-print" style={{ margin: '0 16px 14px', padding: '14px', borderRadius: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Save Your Official Receipt
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={async () => {
                  try {
                    toast('Generating official PDF bill…', 'info');
                    await downloadReceiptPdf(bill, bill.shop);
                    toast('📄 Official PDF Bill Downloaded!', 'success');
                  } catch {
                    toast('Could not generate PDF bill. Printing receipt…', 'error');
                    window.print();
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '11px 12px',
                  background: '#eff6ff',
                  color: '#1d4ed8',
                  border: '1.5px solid #bfdbfe',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                📄 Download PDF Bill
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    toast('Saving bill image…', 'info');
                    await downloadReceiptImage(bill, bill.shop);
                    toast('🖼️ Bill Image Downloaded!', 'success');
                  } catch {
                    toast('Could not download image', 'error');
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '11px 12px',
                  background: '#ffffff',
                  color: '#334155',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                🖼️ Save Image
              </button>
            </div>
          </div>

          {/* 🚀 OFFLINE-TO-ONLINE CONVERSION ACTION CARD */}
          <div className="no-print" style={{ margin: '0 16px 18px', padding: '16px', borderRadius: '16px', background: 'linear-gradient(135deg, #090d16 0%, #1e293b 100%)', color: '#fff', boxShadow: '0 8px 24px rgba(15, 23, 42, 0.22)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '1.6rem' }}>📲</span>
              <div>
                <div style={{ fontWeight: 900, fontSize: '0.98rem', color: '#34d399' }}>
                  Order Online from {shop.name || 'Us'} Next Time!
                </div>
                <div style={{ fontSize: '0.76rem', color: '#cbd5e1', marginTop: '2px' }}>
                  Skip the counter wait! Order from home, upload a handwritten Parchi, or reorder this exact bill in 1 tap.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
              <button
                onClick={handleBrowseOnlineStore}
                style={{
                  width: '100%',
                  padding: '13px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                  color: '#fff',
                  fontWeight: 900,
                  fontSize: '0.94rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(22, 163, 74, 0.35)',
                }}
              >
                🛒 Open {shop.name || 'Store'}&apos;s Online Store ›
              </button>

              <button
                onClick={handleOneTapReorder}
                style={{
                  width: '100%',
                  padding: '11px',
                  borderRadius: '12px',
                  border: '1px solid rgba(52, 211, 153, 0.4)',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#a7f3d0',
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                }}
              >
                🔁 1-Tap Reorder Same Items Online
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'center', padding: '8px 16px 14px', fontSize: '0.72rem', color: '#94a3b8' }}>
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

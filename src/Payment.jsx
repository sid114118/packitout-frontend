import React, { useRef, useState } from 'react';
import useScrollToTop from './useScrollToTop';
import { userFetch } from './utils/api';

// Payment flow (post-Razorpay refactor):
//   'UPI' — customer transfers directly to the shop's UPI ID. We open a
//           UPI deep link (upi://pay?pa=...) so the user's UPI app launches
//           pre-filled with the amount. The order is created with
//           paymentStatus='PendingVerification'; the shop confirms receipt
//           from their OrdersTab via POST /orders/:id/mark-paid.
//   'POP' — pay on pickup. Order is created with paymentStatus='Unpaid';
//           flips to 'Paid' when the shop marks it Picked Up ✅.
// No payment gateway involved — money flows directly to the shop's bank.

const buildUpiDeepLink = ({ upiId, payeeName, amount, note }) => {
  const params = new URLSearchParams();
  params.set('pa', upiId);
  if (payeeName) params.set('pn', payeeName);
  params.set('am', Number(amount).toFixed(2));
  params.set('cu', 'INR');
  if (note) params.set('tn', note);
  return `upi://pay?${params.toString()}`;
};

export default function Payment({ user, cart, targetShop, finalBill, useCoins, coinsUsed, pickupTime, isUrgent, onUserUpdate, onBack, onCheckoutSuccess }) {
  useScrollToTop();

  const [status, setStatus] = useState("");
  const shopUpiId = String(targetShop?.upiId || '').trim();
  const shopHasUpi = shopUpiId.includes('@');
  // Default to UPI if the shop supports it; otherwise the only option is POP.
  const [paymentMethod, setPaymentMethod] = useState(shopHasUpi ? 'UPI' : 'POP');
  // Multi-step UPI flow: 'choose' → 'pay' → posting order
  const [upiStep, setUpiStep] = useState('choose');
  // Single-submit guard — set synchronously the moment the button is tapped so
  // a rapid double-tap can't fire two order POSTs. The previous status-string
  // check read stale state and let double orders slip through.
  const submittingRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const safeFinalBill = Number(finalBill || 0);
  const safePickup = {
    pickupTime: pickupTime || null,
    isUrgent: Boolean(isUrgent),
  };

  const pickupLabel = safePickup.isUrgent
    ? '⚡ Urgent — ASAP'
    : safePickup.pickupTime
      ? `🕒 Pickup at ${new Date(safePickup.pickupTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
      : null;

  const cleanCartItems = () => cart
    .filter(item => item !== null)
    .map(item => ({
      productId: item._id,
      name: item.name,
      qty: Number(item.qty || 1),
      price: Number(item.sellingPrice !== undefined ? item.sellingPrice : (item.mrp || 0)),
      image: item.image || "",
      qnty: item.qnty || "",
      brand: item.brand || "",
      emoji: item.emoji || "🛒",
    }));

  const placeOrder = async (method) => {
    const response = await userFetch(user, '/orders', {
      method: 'POST',
      body: JSON.stringify({
        shopId: targetShop._id,
        paymentMethod: method,
        items: cleanCartItems(),
        coinsUsed: useCoins ? Number(coinsUsed || 0) : 0,
        pickupTime: safePickup.pickupTime,
        isUrgent: safePickup.isUrgent,
      }),
    });
    const order = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(order.error || 'Failed to place order');

    // Mirror the server-debited coin balance into local state so Cart/Header
    // reflect the new balance immediately. Trust the server's coinsUsed value.
    const debited = Number(order?.coinsUsed || 0);
    if (debited > 0) {
      const newCoinBalance = Math.max(0, Math.round(Number(user.coins || 0) - debited));
      const next = { ...user, coins: newCoinBalance };
      try { localStorage.setItem('packitout_user', JSON.stringify(next)); } catch {}
      if (onUserUpdate) onUserUpdate(next);
    }
    return order;
  };

  const handlePlacePopOrder = async () => {
    if (submittingRef.current) return;
    if (!targetShop?._id || !user?._id) {
      setStatus('❌ Missing shop or user info.');
      setTimeout(() => setStatus(''), 3000);
      return;
    }
    submittingRef.current = true;
    setIsSubmitting(true);
    setStatus('⏳ Placing order…');
    try {
      await placeOrder('POP');
      setStatus('✅ Order Placed Successfully!');
      setTimeout(() => onCheckoutSuccess(), 1200);
    } catch (err) {
      setStatus(`❌ ${err.message || 'Failed to place order'}`);
      setTimeout(() => setStatus(''), 3500);
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleOpenUpiApp = () => {
    if (!shopHasUpi) return;
    const link = buildUpiDeepLink({
      upiId: shopUpiId,
      payeeName: targetShop?.name || 'Shop',
      amount: safeFinalBill,
      note: `Order from ${user?.name || 'customer'}`,
    });
    // Use a hidden anchor + window.location so desktop browsers don't get
    // stuck on a blank tab when no UPI handler exists. We DON'T navigate the
    // SPA away — UPI apps intercept the link before navigation completes.
    window.location.href = link;
    setUpiStep('pay');
  };

  const handleConfirmUpiPaid = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    setStatus('⏳ Placing order…');
    try {
      await placeOrder('UPI');
      setStatus('✅ Order placed — the shop will confirm your UPI payment shortly.');
      setTimeout(() => onCheckoutSuccess(), 1500);
    } catch (err) {
      setStatus(`❌ ${err.message || 'Failed to place order'}`);
      setTimeout(() => setStatus(''), 3500);
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleCopyUpi = async () => {
    try {
      await navigator.clipboard.writeText(shopUpiId);
      setStatus('📋 UPI ID copied');
      setTimeout(() => setStatus(''), 2000);
    } catch {
      setStatus('❌ Could not copy — long-press to copy manually');
      setTimeout(() => setStatus(''), 3000);
    }
  };

  return (
    <div style={{ backgroundColor: '#f3f4f6', minHeight: '100vh', fontFamily: 'sans-serif', paddingBottom: '180px', animation: 'fadeIn 0.2s ease-in' }}>

      <div style={{ position: 'sticky', top: 0, backgroundColor: 'white', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '1px solid #e5e7eb', zIndex: 100 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#111827', display: 'flex', alignItems: 'center' }}>←</button>
        <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#111827', fontWeight: '800' }}>Payment</h2>
      </div>

      <div style={{ padding: '16px', maxWidth: '800px', margin: '0 auto' }}>

        <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '12px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ color: '#64748b', fontWeight: '600', fontSize: '0.9rem' }}>Amount to Pay</div>
          <div style={{ color: '#111827', fontWeight: '900', fontSize: '1.4rem' }}>₹{safeFinalBill.toFixed(2)}</div>
        </div>

        {pickupLabel && (
          <div style={{ backgroundColor: safePickup.isUrgent ? '#fff1f2' : '#f0fdf4', border: safePickup.isUrgent ? '1px solid #fecaca' : '1px solid #bbf7d0', padding: '12px 16px', borderRadius: '12px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.5px', color: safePickup.isUrgent ? '#991b1b' : '#166534', textTransform: 'uppercase' }}>Pickup</div>
              <div style={{ fontWeight: 900, color: safePickup.isUrgent ? '#b91c1c' : '#166534', fontSize: '1rem', marginTop: '2px' }}>{pickupLabel}</div>
            </div>
            <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: safePickup.isUrgent ? '#b91c1c' : '#166534', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}>Change</button>
          </div>
        )}

        {upiStep === 'choose' && (
          <>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#111827', marginBottom: '12px', paddingLeft: '4px' }}>Choose how you want to pay</h3>

            <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>

              <label
                style={{
                  display: 'flex', alignItems: 'center', padding: '16px',
                  borderBottom: '1px solid #f1f5f9',
                  cursor: shopHasUpi ? 'pointer' : 'not-allowed',
                  backgroundColor: paymentMethod === 'UPI' ? '#f4fbf6' : 'white',
                  opacity: shopHasUpi ? 1 : 0.55,
                }}
              >
                <input
                  type="radio" name="payment" value="UPI"
                  checked={paymentMethod === 'UPI'}
                  onChange={() => shopHasUpi && setPaymentMethod('UPI')}
                  disabled={!shopHasUpi}
                  style={{ width: '20px', height: '20px', accentColor: '#0c831f', marginRight: '16px' }}
                />
                <div style={{ fontSize: '1.5rem', marginRight: '12px' }}>📱</div>
                <div>
                  <div style={{ fontWeight: '800', color: '#111827', fontSize: '1rem' }}>UPI to Shop</div>
                  <div style={{ fontSize: '0.75rem', color: shopHasUpi ? '#22c55e' : '#94a3b8', fontWeight: '600', marginTop: '2px' }}>
                    {shopHasUpi ? `Pays directly to ${targetShop?.name || 'the shop'}` : 'This shop has not set up UPI'}
                  </div>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', padding: '16px', cursor: 'pointer', backgroundColor: paymentMethod === 'POP' ? '#f4fbf6' : 'white' }}>
                <input
                  type="radio" name="payment" value="POP"
                  checked={paymentMethod === 'POP'}
                  onChange={() => setPaymentMethod('POP')}
                  style={{ width: '20px', height: '20px', accentColor: '#0c831f', marginRight: '16px' }}
                />
                <div style={{ fontSize: '1.5rem', marginRight: '12px' }}>💵</div>
                <div>
                  <div style={{ fontWeight: '800', color: '#111827', fontSize: '1rem' }}>Pay on Shop</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', marginTop: '2px' }}>Pay cash or UPI at the counter when you pick up</div>
                </div>
              </label>

            </div>
          </>
        )}

        {upiStep === 'pay' && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#111827', marginBottom: '6px' }}>Send ₹{safeFinalBill.toFixed(2)} to the shop</h3>
            <p style={{ fontSize: '0.85rem', color: '#475569', marginTop: 0, marginBottom: '14px' }}>
              Pay {targetShop?.name || 'the shop'} on your UPI app. After it goes through, tap "I've paid" and the shop will verify it from their side.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px 14px', borderRadius: '10px', marginBottom: '14px' }}>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Shop UPI ID</div>
                <div style={{ fontSize: '1rem', color: '#0f172a', fontWeight: 800, marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{shopUpiId}</div>
              </div>
              <button onClick={handleCopyUpi} style={{ background: 'white', border: '1px solid #cbd5e1', color: '#0f172a', fontWeight: 700, padding: '8px 12px', borderRadius: '8px', fontSize: '0.8rem', cursor: 'pointer' }}>Copy</button>
            </div>
            <button
              onClick={handleOpenUpiApp}
              style={{ width: '100%', padding: '14px', backgroundColor: '#0c831f', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 900, fontSize: '1rem', cursor: 'pointer', marginBottom: '10px' }}
            >
              Open UPI App Again
            </button>
            <button
              onClick={() => setUpiStep('choose')}
              style={{ width: '100%', padding: '12px', backgroundColor: 'white', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '10px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}
            >
              Choose a different payment method
            </button>
          </div>
        )}
      </div>

      {status && (
        <div role="status" aria-live="polite" style={{ position: 'fixed', bottom: '130px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#334155', color: 'white', padding: '12px 24px', borderRadius: '30px', fontWeight: 'bold', fontSize: '0.9rem', zIndex: 1000, boxShadow: '0 4px 15px rgba(0,0,0,0.2)', whiteSpace: 'nowrap', maxWidth: '90vw', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {status}
        </div>
      )}

      <div style={{ position: 'fixed', bottom: '70px', left: 0, right: 0, backgroundColor: 'white', padding: '12px 16px', borderTop: '1px solid #e5e7eb', boxShadow: '0 -4px 10px rgba(0,0,0,0.03)', zIndex: 90 }}>
        {upiStep === 'choose' && paymentMethod === 'UPI' && (
          <button
            onClick={handleOpenUpiApp}
            disabled={!shopHasUpi || isSubmitting}
            aria-busy={isSubmitting}
            style={{ width: '100%', maxWidth: '800px', margin: '0 auto', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px 20px', backgroundColor: '#0c831f', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '900', fontSize: '1.1rem', cursor: shopHasUpi ? 'pointer' : 'not-allowed', boxShadow: '0 4px 12px rgba(12, 131, 31, 0.3)', opacity: shopHasUpi ? 1 : 0.55, transition: 'all 0.2s ease' }}
          >
            Pay ₹{safeFinalBill.toFixed(2)} via UPI
          </button>
        )}
        {upiStep === 'choose' && paymentMethod === 'POP' && (
          <button
            onClick={handlePlacePopOrder}
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            style={{ width: '100%', maxWidth: '800px', margin: '0 auto', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px 20px', backgroundColor: '#0c831f', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '900', fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(12, 131, 31, 0.3)', opacity: isSubmitting ? 0.7 : 1, transition: 'all 0.2s ease' }}
          >
            {isSubmitting ? 'Processing…' : `Place Order for ₹${safeFinalBill.toFixed(2)}`}
          </button>
        )}
        {upiStep === 'pay' && (
          <button
            onClick={handleConfirmUpiPaid}
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            style={{ width: '100%', maxWidth: '800px', margin: '0 auto', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px 20px', backgroundColor: '#0c831f', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '900', fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(12, 131, 31, 0.3)', opacity: isSubmitting ? 0.7 : 1, transition: 'all 0.2s ease' }}
          >
            {isSubmitting ? 'Placing order…' : `I've paid ₹${safeFinalBill.toFixed(2)} via UPI`}
          </button>
        )}
      </div>

    </div>
  );
}

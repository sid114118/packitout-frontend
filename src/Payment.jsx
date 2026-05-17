import React, { useState } from 'react';
import useScrollToTop from './useScrollToTop';

const API_BASE = (import.meta.env.VITE_API_BASE || "https://darkslategrey-snail-415133.hostingersite.com");
const RAZORPAY_SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

// Inject the Razorpay checkout script on demand. Returns a promise that resolves
// when window.Razorpay is available. Cached after first load.
let razorpayScriptPromise = null;
const loadRazorpayScript = () => {
  if (typeof window !== 'undefined' && window.Razorpay) return Promise.resolve(true);
  if (razorpayScriptPromise) return razorpayScriptPromise;
  razorpayScriptPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => { razorpayScriptPromise = null; resolve(false); };
    document.body.appendChild(script);
  });
  return razorpayScriptPromise;
};

export default function Payment({ user, cart, targetShop, finalBill, useCoins, coinsUsed, pickupTime, isUrgent, onBack, onCheckoutSuccess }) {
  useScrollToTop();

  const [status, setStatus] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");

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
      // Display metadata — lets the Orders page show item images / qty labels
      // instead of generic placeholders.
      image: item.image || "",
      qnty: item.qnty || "",
      brand: item.brand || "",
      emoji: item.emoji || "🛒",
    }));

  const placeCodOrder = async () => {
    const response = await fetch(`${API_BASE}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user._id,
        shopId: targetShop._id,
        paymentMethod: "COD",
        paymentStatus: "Unpaid",
        items: cleanCartItems(),
        totalAmount: safeFinalBill,
        coinsUsed: useCoins ? Number(coinsUsed || 0) : 0,
        pickupTime: safePickup.pickupTime,
        isUrgent: safePickup.isUrgent,
      }),
    });
    if (!response.ok) throw new Error("Failed to place order");

    if (useCoins && coinsUsed > 0) {
      const newCoinBalance = Math.round(Number(user.coins || 0) - Number(coinsUsed));
      await fetch(`${API_BASE}/users/${user._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coins: newCoinBalance }),
      });
      localStorage.setItem("packitout_user", JSON.stringify({ ...user, coins: newCoinBalance }));
    }
  };

  const placeOnlineOrder = async () => {
    const ok = await loadRazorpayScript();
    if (!ok || !window.Razorpay) throw new Error("Could not load payment gateway. Check your connection.");

    const items = cleanCartItems();
    const coinsUsedSafe = useCoins ? Number(coinsUsed || 0) : 0;

    const createRes = await fetch(`${API_BASE}/payments/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user._id,
        shopId: targetShop._id,
        items,
        coinsUsed: coinsUsedSafe,
        pickupTime: safePickup.pickupTime,
        isUrgent: safePickup.isUrgent,
      }),
    });
    const createData = await createRes.json();
    if (!createRes.ok) throw new Error(createData.error || "Could not start payment.");

    const { razorpayOrderId, amount, currency, keyId } = createData;
    if (!keyId) throw new Error("Payment gateway not configured on the server.");

    return new Promise((resolve, reject) => {
      const rzp = new window.Razorpay({
        key: keyId,
        amount,
        currency,
        order_id: razorpayOrderId,
        name: targetShop?.name || "PackItOut",
        description: `Order from ${targetShop?.name || "your shop"}`,
        prefill: {
          name: user?.name || "",
          contact: user?.phone || "",
        },
        theme: { color: "#0c831f" },
        method: paymentMethod === "Card"
          ? { card: true, upi: false, netbanking: false, wallet: false }
          : { upi: true, card: false, netbanking: false, wallet: false },
        modal: {
          ondismiss: () => reject(new Error("Payment cancelled")),
        },
        handler: async (response) => {
          try {
            setStatus("⏳ Verifying payment...");
            const verifyRes = await fetch(`${API_BASE}/payments/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                userId: user._id,
                shopId: targetShop._id,
                items,
                paymentMethod,
                coinsUsed: coinsUsedSafe,
                pickupTime: safePickup.pickupTime,
                isUrgent: safePickup.isUrgent,
              }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(verifyData.error || "Payment could not be verified.");
            }

            if (coinsUsedSafe > 0) {
              const newCoinBalance = Math.round(Number(user.coins || 0) - coinsUsedSafe);
              localStorage.setItem("packitout_user", JSON.stringify({ ...user, coins: newCoinBalance }));
            }
            resolve(verifyData.order);
          } catch (err) {
            reject(err);
          }
        },
      });
      rzp.on('payment.failed', (resp) => {
        reject(new Error(resp?.error?.description || "Payment failed"));
      });
      rzp.open();
    });
  };

  const handleCheckout = async () => {
    if (!targetShop?._id || !user?._id) {
      setStatus("❌ Missing shop or user info.");
      setTimeout(() => setStatus(""), 3000);
      return;
    }

    setStatus(`⏳ Processing ${paymentMethod} Payment...`);
    try {
      if (paymentMethod === "COD") {
        await placeCodOrder();
      } else {
        await placeOnlineOrder();
      }
      setStatus("✅ Order Placed Successfully!");
      setTimeout(() => onCheckoutSuccess(), 1500);
    } catch (err) {
      setStatus(`❌ ${err.message || "Payment failed"}`);
      setTimeout(() => setStatus(""), 3500);
    }
  };

  return (
    <div style={{ backgroundColor: '#f3f4f6', minHeight: '100vh', fontFamily: 'sans-serif', paddingBottom: '180px', animation: 'fadeIn 0.2s ease-in' }}>

      {/* Payment Header */}
      <div style={{ position: 'sticky', top: 0, backgroundColor: 'white', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '1px solid #e5e7eb', zIndex: 100 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#111827', display: 'flex', alignItems: 'center' }}>←</button>
        <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#111827', fontWeight: '800' }}>Payment</h2>
      </div>

      <div style={{ padding: '16px', maxWidth: '800px', margin: '0 auto' }}>

        {/* Bill Summary Strip */}
        <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '12px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ color: '#64748b', fontWeight: '600', fontSize: '0.9rem' }}>Amount to Pay</div>
          <div style={{ color: '#111827', fontWeight: '900', fontSize: '1.4rem' }}>₹{safeFinalBill.toFixed(2)}</div>
        </div>

        {/* Pickup-time strip */}
        {pickupLabel && (
          <div
            style={{
              backgroundColor: safePickup.isUrgent ? '#fff1f2' : '#f0fdf4',
              border: safePickup.isUrgent ? '1px solid #fecaca' : '1px solid #bbf7d0',
              padding: '12px 16px',
              borderRadius: '12px',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.5px', color: safePickup.isUrgent ? '#991b1b' : '#166534', textTransform: 'uppercase' }}>Pickup</div>
              <div style={{ fontWeight: 900, color: safePickup.isUrgent ? '#b91c1c' : '#166534', fontSize: '1rem', marginTop: '2px' }}>{pickupLabel}</div>
            </div>
            <button
              onClick={onBack}
              style={{ background: 'transparent', border: 'none', color: safePickup.isUrgent ? '#b91c1c' : '#166534', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}
            >
              Change
            </button>
          </div>
        )}

        <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#111827', marginBottom: '12px', paddingLeft: '4px' }}>Select Payment Method</h3>

        {/* Payment Options */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>

          <label style={{ display: 'flex', alignItems: 'center', padding: '16px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', backgroundColor: paymentMethod === 'UPI' ? '#f4fbf6' : 'white' }}>
            <input type="radio" name="payment" value="UPI" checked={paymentMethod === 'UPI'} onChange={() => setPaymentMethod('UPI')} style={{ width: '20px', height: '20px', accentColor: '#0c831f', marginRight: '16px' }} />
            <div style={{ fontSize: '1.5rem', marginRight: '12px' }}>📱</div>
            <div>
              <div style={{ fontWeight: '800', color: '#111827', fontSize: '1rem' }}>UPI (GPay, PhonePe)</div>
              <div style={{ fontSize: '0.75rem', color: '#22c55e', fontWeight: '600', marginTop: '2px' }}>Fastest & Most Secure</div>
            </div>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', padding: '16px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', backgroundColor: paymentMethod === 'Card' ? '#f4fbf6' : 'white' }}>
            <input type="radio" name="payment" value="Card" checked={paymentMethod === 'Card'} onChange={() => setPaymentMethod('Card')} style={{ width: '20px', height: '20px', accentColor: '#0c831f', marginRight: '16px' }} />
            <div style={{ fontSize: '1.5rem', marginRight: '12px' }}>💳</div>
            <div>
              <div style={{ fontWeight: '800', color: '#111827', fontSize: '1rem' }}>Credit / Debit Card</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', marginTop: '2px' }}>Visa, MasterCard, RuPay</div>
            </div>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', padding: '16px', cursor: 'pointer', backgroundColor: paymentMethod === 'COD' ? '#f4fbf6' : 'white' }}>
            <input type="radio" name="payment" value="COD" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} style={{ width: '20px', height: '20px', accentColor: '#0c831f', marginRight: '16px' }} />
            <div style={{ fontSize: '1.5rem', marginRight: '12px' }}>💵</div>
            <div>
              <div style={{ fontWeight: '800', color: '#111827', fontSize: '1rem' }}>Pay at Shop</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', marginTop: '2px' }}>Pay at the counter when you pick up</div>
            </div>
          </label>

        </div>
      </div>

      {status && (
        <div style={{ position: 'fixed', bottom: '130px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#334155', color: 'white', padding: '12px 24px', borderRadius: '30px', fontWeight: 'bold', fontSize: '0.9rem', zIndex: 1000, boxShadow: '0 4px 15px rgba(0,0,0,0.2)', whiteSpace: 'nowrap' }}>
          {status}
        </div>
      )}

      <div style={{ position: 'fixed', bottom: '70px', left: 0, right: 0, backgroundColor: 'white', padding: '12px 16px', borderTop: '1px solid #e5e7eb', boxShadow: '0 -4px 10px rgba(0,0,0,0.03)', zIndex: 90 }}>
        <button
          onClick={handleCheckout}
          disabled={status.includes("⏳")}
          style={{ width: '100%', maxWidth: '800px', margin: '0 auto', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px 20px', backgroundColor: '#0c831f', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '900', fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(12, 131, 31, 0.3)', opacity: status.includes("⏳") ? 0.7 : 1, transition: 'all 0.2s ease' }}
        >
          {status.includes("⏳") ? "Processing..." : paymentMethod === "COD" ? `Place Order for ₹${safeFinalBill.toFixed(2)}` : `Pay ₹${safeFinalBill.toFixed(2)} Securely`}
        </button>
      </div>

    </div>
  );
}

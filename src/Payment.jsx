import React, { useState } from 'react';

export default function Payment({ user, cart, targetShop, finalBill, useCoins, coinsUsed, onBack, onCheckoutSuccess }) {
  const [status, setStatus] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI"); 
  
  // 🛡️ Ensure finalBill is always a number so .toFixed() never crashes
  const safeFinalBill = Number(finalBill || 0);

  const handleCheckout = async () => {
    setStatus(`⏳ Processing ${paymentMethod} Payment...`);
    
    try {
      // 🛡️ Strip out null items and force numbers to prevent Backend crashes
      const cleanCartItems = cart.filter(item => item !== null).map(item => ({
        productId: item._id,
        name: item.name,
        qty: Number(item.qty || 1),
        price: Number(item.sellingPrice !== undefined ? item.sellingPrice : (item.mrp || 0))
      }));

      const response = await fetch("https://darkslategrey-snail-415133.hostingersite.com/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user._id, 
          shopId: targetShop._id,
          paymentMethod: paymentMethod, 
          paymentStatus: paymentMethod === "COD" ? "Unpaid" : "Paid", 
          items: cleanCartItems,
          totalAmount: safeFinalBill
        })
      });

      if (response.ok) {
        if (useCoins && coinsUsed > 0) {
          const newCoinBalance = Math.round(Number(user.coins || 0) - Number(coinsUsed)); 
          await fetch(`https://darkslategrey-snail-415133.hostingersite.com/users/${user._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ coins: newCoinBalance })
          });
          
          const updatedUser = { ...user, coins: newCoinBalance };
          localStorage.setItem("packitout_user", JSON.stringify(updatedUser));
        }

        setStatus("✅ Order Placed Successfully!");
        setTimeout(() => onCheckoutSuccess(), 1500);
      } else {
        setStatus("❌ Failed to process order.");
        setTimeout(() => setStatus(""), 3000);
      }
    } catch (err) { 
      setStatus("❌ Connection error"); 
      setTimeout(() => setStatus(""), 3000);
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
        <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '12px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ color: '#64748b', fontWeight: '600', fontSize: '0.9rem' }}>Amount to Pay</div>
          <div style={{ color: '#111827', fontWeight: '900', fontSize: '1.4rem' }}>₹{safeFinalBill.toFixed(2)}</div>
        </div>

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
              <div style={{ fontWeight: '800', color: '#111827', fontSize: '1rem' }}>Cash on Delivery</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', marginTop: '2px' }}>Pay when you receive the order</div>
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

    import React, { useState, useEffect } from 'react';

export default function Cart({ cart, user, onBack, onCheckoutSuccess }) {
  const [status, setStatus] = useState("");
  const [targetShop, setTargetShop] = useState(null);
  const totalBill = cart.reduce((sum, item) => sum + (item.mrp * item.qty), 0);

  // 🕵️ Find the shop in the user's pincode as soon as they open the cart
  useEffect(() => {
    if (user?.pincode) {
      fetch(`https://darkslategrey-snail-415133.hostingersite.com/shops/find/${user.pincode}`)
        .then(res => res.json())
        .then(data => setTargetShop(data))
        .catch(err => console.log("Shop lookup failed"));
    }
  }, [user]);

  const handleCheckout = async () => {
    if (!targetShop) {
      setStatus("❌ No shop found in your pincode!");
      return;
    }

    setStatus("⏳ Sending Parchi to " + targetShop.name + "...");
    
    try {
      const response = await fetch("https://darkslategrey-snail-415133.hostingersite.com/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user._id, 
          shopId: targetShop._id, // 👈 NOW USING THE REAL SHOP ID!
          items: cart,
          totalAmount: totalBill
        })
      });

      if (response.ok) {
        setStatus("✅ Order Sent Successfully!");
        setTimeout(() => onCheckoutSuccess(), 1500);
      }
    } catch (err) { setStatus("❌ Connection error"); }
  };

  return (
    <div style={{ backgroundColor: '#f4f7f6', minHeight: '100vh', fontFamily: 'sans-serif', paddingBottom: '100px' }}>
      <div style={{ backgroundColor: 'white', padding: '20px', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: '1.2rem' }}>⬅️</button>
        <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Your Cart</h2>
      </div>

      <div style={{ padding: '20px' }}>
        {/* SHOP INFO */}
        {targetShop ? (
          <div style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '0.85rem', fontWeight: 'bold' }}>
            🛒 Ordering from: {targetShop.name} ({targetShop.pincode})
          </div>
        ) : (
          <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '0.85rem' }}>
            ⚠️ Finding a shop in {user?.pincode || 'your area'}...
          </div>
        )}

        {/* CART ITEMS LIST (omitted for space - keep your existing mapping here) */}
        {cart.map((item, i) => (
           <div key={i} style={{ background: 'white', padding: '10px', borderRadius: '8px', marginBottom: '10px' }}>
             {item.emoji} {item.name} - ₹{item.mrp} x {item.qty}
           </div>
        ))}

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', marginTop: '20px' }}>
          <strong>Total to Pay: ₹{totalBill}</strong>
        </div>
      </div>

      {status && <div style={{ position: 'fixed', bottom: '90px', left: '20px', right: '20px', backgroundColor: '#2f3640', color: 'white', padding: '15px', borderRadius: '10px', textAlign: 'center' }}>{status}</div>}

      <div style={{ position: 'fixed', bottom: 0, width: '100%', backgroundColor: 'white', padding: '15px 20px' }}>
        <button onClick={handleCheckout} disabled={!targetShop} style={{ width: '100%', backgroundColor: targetShop ? '#10b981' : '#94a3b8', color: 'white', border: 'none', padding: '16px', borderRadius: '12px', fontWeight: 'bold' }}>
          {targetShop ? `Pay ₹${totalBill} & Checkout` : "No Shop Available"}
        </button>
      </div>
    </div>
  );
}

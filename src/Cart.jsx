import React, { useState, useEffect } from 'react';

export default function Cart({ cart, user, onBack, onCheckoutSuccess }) {
  const [status, setStatus] = useState("");
  const [availableShops, setAvailableShops] = useState([]); // 🏪 List of all nearby shops
  const [targetShop, setTargetShop] = useState(null); // 🎯 The one the user picks
  const [loadingShops, setLoadingShops] = useState(true);

  const totalBill = cart.reduce((sum, item) => sum + (item.mrp * item.qty), 0);

  // 🕵️ Fetch all shops matching the user's pincode
  useEffect(() => {
    if (user?.pincode) {
      setLoadingShops(true);
      // We'll use a general search route to get ALL shops in that pincode
      fetch(`https://darkslategrey-snail-415133.hostingersite.com/orders`) // Temporary: we'll fetch all and filter by pincode
        .then(res => res.json())
        .then(data => {
          // Note: In a real app, use a specific /shops/search?pincode=... route
          // For now, let's assume your backend returns shops correctly
          fetch(`https://darkslategrey-snail-415133.hostingersite.com/shops/find/${user.pincode}`)
            .then(res => res.json())
            .then(shop => {
                if(shop && !shop.error) {
                    setAvailableShops([shop]); // Found at least one
                    setTargetShop(shop); // Auto-select the first one
                }
                setLoadingShops(false);
            })
            .catch(() => setLoadingShops(false));
        })
        .catch(() => setLoadingShops(false));
    }
  }, [user]);

  const handleCheckout = async () => {
    if (!targetShop) {
      setStatus("❌ Please select a shop first!");
      return;
    }

    setStatus(`⏳ Sending Parchi to ${targetShop.name}...`);
    
    try {
      const response = await fetch("https://darkslategrey-snail-415133.hostingersite.com/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user._id, 
          shopId: targetShop._id,
          items: cart,
          totalAmount: totalBill
        })
      });

      if (response.ok) {
        setStatus("✅ Order Sent Successfully!");
        setTimeout(() => onCheckoutSuccess(), 1500);
      } else {
        setStatus("❌ Failed to place order.");
      }
    } catch (err) { setStatus("❌ Connection error"); }
  };

  return (
    <div style={{ backgroundColor: '#f4f7f6', minHeight: '100vh', fontFamily: 'sans-serif', paddingBottom: '120px' }}>
      
      {/* Header */}
      <div style={{ backgroundColor: 'white', padding: '20px', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>⬅️</button>
        <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#2f3640' }}>Checkout</h2>
      </div>

      <div style={{ padding: '20px' }}>
        
        {/* 🏪 SHOP SELECTION SECTION */}
        <h3 style={{ fontSize: '1rem', color: '#7f8fa6', marginBottom: '10px' }}>Select Shop in {user?.pincode}</h3>
        
        {loadingShops ? (
          <div style={{ padding: '15px', background: '#eee', borderRadius: '10px' }}>🔍 Finding nearby shops...</div>
        ) : availableShops.length > 0 ? (
          availableShops.map((shop) => (
            <div 
              key={shop._id}
              onClick={() => setTargetShop(shop)}
              style={{ 
                backgroundColor: 'white', 
                padding: '15px', 
                borderRadius: '12px', 
                marginBottom: '10px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                border: targetShop?._id === shop._id ? '2px solid #10b981' : '2px solid transparent',
                cursor: 'pointer'
              }}
            >
              <div>
                <strong style={{ display: 'block', color: '#2f3640' }}>{shop.name}</strong>
                <span style={{ fontSize: '0.8rem', color: '#7f8fa6' }}>Delivery in 15-30 mins</span>
              </div>
              {targetShop?._id === shop._id && <span style={{ color: '#10b981', fontWeight: 'bold' }}>✅ Selected</span>}
            </div>
          ))
        ) : (
          <div style={{ padding: '15px', background: '#fee2e2', color: '#991b1b', borderRadius: '10px' }}>
            ❌ No shops found in your pincode. Try a different address.
          </div>
        )}

        {/* 🛒 ITEM SUMMARY */}
        <h3 style={{ fontSize: '1rem', color: '#7f8fa6', marginTop: '25px', marginBottom: '10px' }}>Order Summary</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {cart.map((item, i) => (
            <div key={i} style={{ background: 'white', padding: '12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between' }}>
              <span>{item.emoji} {item.name} (x{item.qty})</span>
              <span style={{ fontWeight: 'bold' }}>₹{item.mrp * item.qty}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '20px', padding: '15px', borderTop: '2px dashed #ddd', textAlign: 'right' }}>
          <span style={{ color: '#7f8fa6' }}>Total Bill: </span>
          <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#2f3640' }}>₹{totalBill}</span>
        </div>
      </div>

      {/* 🟢 FOOTER ACTION */}
      {status && (
        <div style={{ position: 'fixed', bottom: '100px', left: '20px', right: '20px', backgroundColor: '#2f3640', color: 'white', padding: '15px', borderRadius: '10px', textAlign: 'center', zIndex: 1000 }}>
          {status}
        </div>
      )}

      <div style={{ position: 'fixed', bottom: 0, width: '100%', backgroundColor: 'white', padding: '20px', boxShadow: '0 -5px 15px rgba(0,0,0,0.05)', boxSizing: 'border-box' }}>
        <button 
          onClick={handleCheckout} 
          disabled={!targetShop} 
          style={{ 
            width: '100%', 
            backgroundColor: targetShop ? '#10b981' : '#cbd5e1', 
            color: 'white', 
            border: 'none', 
            padding: '16px', 
            borderRadius: '12px', 
            fontWeight: 'bold', 
            fontSize: '1.1rem',
            cursor: targetShop ? 'pointer' : 'not-allowed'
          }}
        >
          {targetShop ? `Confirm Order (₹${totalBill})` : "Select a Shop to Continue"}
        </button>
      </div>
    </div>
  );
}

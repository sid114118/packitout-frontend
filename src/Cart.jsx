import React, { useState, useEffect } from 'react';

export default function Cart({ cart, user, onBack, onCheckoutSuccess }) {
  const [status, setStatus] = useState("");
  const [availableShops, setAvailableShops] = useState([]); 
  const [targetShop, setTargetShop] = useState(null); 
  const [loadingShops, setLoadingShops] = useState(true);
  
  // 🪙 Coin Discount State
  const [useCoins, setUseCoins] = useState(false);

  // 🧮 NEW BILL CALCULATIONS (10 Coins = ₹1)
  const subTotal = cart.reduce((sum, item) => sum + (item.mrp * item.qty), 0);
  
  // Calculate max possible discount in Rupees (Coins * 0.10)
  const maxCoinDiscount = (user?.coins || 0) * 0.10; 
  // Make sure we don't discount more than the actual bill
  const discount = useCoins ? Math.min(maxCoinDiscount, subTotal) : 0; 
  // Calculate exactly how many coins we are spending for this discount
  const coinsUsed = discount * 10; 
  
  const finalBill = subTotal - discount;

  // 🕵️ Fetch all shops matching the user's pincode
  useEffect(() => {
    if (user?.pincode) {
      setLoadingShops(true);
      fetch(`https://darkslategrey-snail-415133.hostingersite.com/shops/all/${user.pincode}`)
        .then(res => res.json())
        .then(data => {
          setAvailableShops(data);
          
          if (data.length > 0) {
            const primaryId = user.primaryShop?._id || user.primaryShop;
            const myPrimary = data.find(s => s._id === primaryId);
            setTargetShop(myPrimary || data[0]); 
          }
          setLoadingShops(false);
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
      // 1. Submit the Order with the Final (Discounted) Amount
      const response = await fetch("https://darkslategrey-snail-415133.hostingersite.com/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user._id, 
          shopId: targetShop._id,
          items: cart,
          totalAmount: finalBill
        })
      });

      if (response.ok) {
        // 2. Deduct EXACT Coins from User Profile
        if (useCoins && coinsUsed > 0) {
          const newCoinBalance = user.coins - coinsUsed;
          await fetch(`https://darkslategrey-snail-415133.hostingersite.com/users/${user._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ coins: newCoinBalance })
          });
          
          const updatedUser = { ...user, coins: newCoinBalance };
          localStorage.setItem("packitout_user", JSON.stringify(updatedUser));
        }

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
        <h3 style={{ fontSize: '1rem', color: '#7f8fa6', marginBottom: '10px' }}>Pick-up Point ({user?.pincode})</h3>
        
        {loadingShops ? (
          <div style={{ padding: '15px', background: '#eee', borderRadius: '10px' }}>🔍 Finding nearby shops...</div>
        ) : availableShops.length > 0 ? (
          availableShops.map((shop) => {
            const isPrimary = (user?.primaryShop?._id || user?.primaryShop) === shop._id;
            return (
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
                  cursor: 'pointer',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
                }}
              >
                <div>
                  <strong style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2f3640' }}>
                    {shop.name}
                    {isPrimary && <span style={{ backgroundColor: '#fef3c7', color: '#d97706', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>⭐ Primary</span>}
                  </strong>
                  <span style={{ fontSize: '0.8rem', color: '#7f8fa6' }}>Ready in 10-15 mins</span>
                </div>
                {targetShop?._id === shop._id && <span style={{ color: '#10b981', fontWeight: 'bold' }}>✅ Selected</span>}
              </div>
            );
          })
        ) : (
          <div style={{ padding: '15px', background: '#fee2e2', color: '#991b1b', borderRadius: '10px' }}>
            ❌ No shops found in your pincode. Please update your profile.
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

        {/* 🪙 COIN DISCOUNT TOGGLE */}
        {user?.coins > 0 && (
          <div style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)', padding: '15px', borderRadius: '12px', marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #f59e0b', boxShadow: '0 4px 6px rgba(245, 158, 11, 0.1)' }}>
            <div>
              <strong style={{ color: '#b45309', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '1.1rem' }}>🪙 PackIt Coins</strong>
              {/* 👇 Updated text so users understand the value */}
              <div style={{ fontSize: '0.85rem', color: '#d97706', marginTop: '2px' }}>
                Balance: {user.coins} (Worth ₹{maxCoinDiscount.toFixed(2)})
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <span style={{ fontWeight: 'bold', color: '#b45309', fontSize: '0.9rem' }}>Use Coins</span>
              <input 
                type="checkbox" 
                checked={useCoins} 
                onChange={(e) => setUseCoins(e.target.checked)}
                style={{ width: '22px', height: '22px', accentColor: '#d97706', cursor: 'pointer' }}
              />
            </label>
          </div>
        )}

        {/* 💵 FINAL BILL BREAKDOWN */}
        <div style={{ marginTop: '20px', padding: '15px', borderTop: '2px dashed #ddd', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#7f8fa6', fontSize: '0.95rem' }}>
            <span>Item Total:</span>
            <span>₹{subTotal}</span>
          </div>
          {useCoins && discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981', fontWeight: 'bold', fontSize: '0.95rem' }}>
              <span>Coin Discount (-{coinsUsed} Coins):</span>
              <span>- ₹{discount.toFixed(2)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #eee' }}>
            <span style={{ color: '#2f3640', fontWeight: 'bold', fontSize: '1.2rem' }}>To Pay:</span>
            <span style={{ fontSize: '1.4rem', fontWeight: '900', color: '#2f3640' }}>₹{finalBill.toFixed(2)}</span>
          </div>
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
            cursor: targetShop ? 'pointer' : 'not-allowed',
            boxShadow: targetShop ? '0 4px 10px rgba(16, 185, 129, 0.3)' : 'none'
          }}
        >
          {targetShop ? `Confirm Order (₹${finalBill.toFixed(2)})` : "Select a Shop to Continue"}
        </button>
      </div>
    </div>
  );
              }

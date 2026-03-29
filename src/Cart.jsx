import React, { useState, useEffect } from 'react';

// 👇 Notice we added setCart here so the buttons can modify the cart!
export default function Cart({ cart, setCart, user, onBack, onCheckoutSuccess }) {
  const [status, setStatus] = useState("");
  const [availableShops, setAvailableShops] = useState([]); 
  const [targetShop, setTargetShop] = useState(null); 
  const [loadingShops, setLoadingShops] = useState(true);
  
  // 🪙 Coin Discount State
  const [useCoins, setUseCoins] = useState(false);

  // 🧮 BILL CALCULATIONS
  // Use sellingPrice if available, otherwise fallback to mrp
  const itemTotal = cart.reduce((sum, item) => sum + ((item.sellingPrice || item.mrp) * item.qty), 0);
  const totalMrp = cart.reduce((sum, item) => sum + (item.mrp * item.qty), 0);
  
  // Coin Logic (10 Coins = ₹1)
  const maxCoinDiscount = (user?.coins || 0) * 0.10; 
  const discount = useCoins ? Math.min(maxCoinDiscount, itemTotal) : 0; 
  const coinsUsed = discount * 10; 
  
  const finalBill = itemTotal - discount;

  // --- 🛒 ADD/REMOVE ITEM LOGIC ---
  const updateQty = (productId, delta) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item._id === productId) {
          const newQty = item.qty + delta;
          return newQty > 0 ? { ...item, qty: newQty } : null; // Remove if qty is 0
        }
        return item;
      }).filter(item => item !== null); // Clear out the nulls
    });
  };

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
      setTimeout(() => setStatus(""), 3000);
      return;
    }

    setStatus(`⏳ Sending Order to ${targetShop.name}...`);
    
    try {
      const response = await fetch("https://darkslategrey-snail-415133.hostingersite.com/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user._id, 
          shopId: targetShop._id,
          items: cart.map(item => ({
            productId: item._id,
            name: item.name,
            qty: item.qty,
            price: item.sellingPrice || item.mrp
          })),
          totalAmount: finalBill
        })
      });

      if (response.ok) {
        // Deduct Coins
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
        setTimeout(() => setStatus(""), 3000);
      }
    } catch (err) { 
      setStatus("❌ Connection error"); 
      setTimeout(() => setStatus(""), 3000);
    }
  };

  // --- EMPTY CART UI ---
  if (cart.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#f4f7f6', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '10px' }}>🛒</div>
        <h2 style={{ color: '#0f172a', marginBottom: '10px' }}>Your cart is empty</h2>
        <p style={{ color: '#64748b', marginBottom: '20px' }}>Looks like you haven't added anything yet.</p>
        <button onClick={onBack} style={{ padding: '12px 24px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
          Browse Products
        </button>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f4f7f6', minHeight: '100vh', fontFamily: 'sans-serif', paddingBottom: '140px' }}>
      
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, backgroundColor: 'white', padding: '15px 20px', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', zIndex: 100 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#0f172a' }}>⬅</button>
        <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>Checkout</h2>
      </div>

      <div style={{ padding: '15px', maxWidth: '800px', margin: '0 auto' }}>
        
        {/* 🏪 SHOP SELECTION SECTION */}
        <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
          <h3 style={{ fontSize: '0.9rem', color: '#64748b', marginTop: 0, marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>📍 Pick-up Point ({user?.pincode})</h3>
          
          {loadingShops ? (
            <div style={{ padding: '15px', background: '#f1f5f9', borderRadius: '8px', color: '#64748b', textAlign: 'center' }}>🔍 Finding nearby shops...</div>
          ) : availableShops.length > 0 ? (
            availableShops.map((shop) => {
              const isPrimary = (user?.primaryShop?._id || user?.primaryShop) === shop._id;
              const isSelected = targetShop?._id === shop._id;
              return (
                <div 
                  key={shop._id}
                  onClick={() => setTargetShop(shop)}
                  style={{ 
                    backgroundColor: isSelected ? '#ecfdf5' : '#f8fafc', 
                    padding: '12px 15px', 
                    borderRadius: '8px', 
                    marginBottom: '10px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    border: isSelected ? '1px solid #10b981' : '1px solid #e2e8f0',
                    cursor: 'pointer'
                  }}
                >
                  <div>
                    <strong style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontSize: '0.95rem' }}>
                      {shop.name}
                      {isPrimary && <span style={{ backgroundColor: '#fef3c7', color: '#d97706', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>⭐ Primary</span>}
                    </strong>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Ready in 10-15 mins</span>
                  </div>
                  {isSelected && <span style={{ color: '#10b981', fontSize: '1.2rem' }}>✅</span>}
                </div>
              );
            })
          ) : (
            <div style={{ padding: '15px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', fontSize: '0.85rem' }}>
              ❌ No shops found in your pincode. Please update your profile.
            </div>
          )}
        </div>

        {/* 🛒 ITEM SUMMARY WITH QUANTITY CONTROLS */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '15px', marginBottom: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '15px', color: '#0f172a' }}>Review Items</div>
          
          {cart.map((item, index) => (
            <div key={item._id} style={{ display: 'flex', gap: '15px', alignItems: 'center', paddingBottom: '15px', marginBottom: '15px', borderBottom: index === cart.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
              
              {/* Image */}
              <div style={{ width: '50px', height: '50px', backgroundColor: '#f8fafc', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {item.image ? <img src={item.image} style={{ maxWidth: '40px', maxHeight: '40px' }} alt={item.name} /> : <span style={{ fontSize: '24px' }}>{item.emoji}</span>}
              </div>

              {/* Details */}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '0.85rem', lineHeight: '1.2', marginBottom: '4px' }}>{item.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>{item.qnty}</div>
                <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '0.9rem' }}>₹{item.sellingPrice || item.mrp}</div>
              </div>

              {/* Qty Controls */}
              <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#10b981', borderRadius: '6px', color: 'white', fontWeight: 'bold', padding: '2px' }}>
                <button onClick={() => updateQty(item._id, -1)} style={{ background: 'none', border: 'none', color: 'white', padding: '4px 12px', cursor: 'pointer', fontSize: '1.1rem' }}>−</button>
                <span style={{ fontSize: '0.9rem', width: '16px', textAlign: 'center' }}>{item.qty}</span>
                <button onClick={() => updateQty(item._id, 1)} style={{ background: 'none', border: 'none', color: 'white', padding: '4px 12px', cursor: 'pointer', fontSize: '1.1rem' }}>+</button>
              </div>

            </div>
          ))}
        </div>

        {/* 🪙 COIN DISCOUNT TOGGLE */}
        {user?.coins > 0 && (
          <div style={{ background: 'linear-gradient(135deg, #fefce8, #fef08a)', padding: '15px', borderRadius: '12px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #fde047', boxShadow: '0 2px 5px rgba(234, 179, 8, 0.1)' }}>
            <div>
              <strong style={{ color: '#a16207', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '1rem' }}>🪙 PackIt Coins</strong>
              <div style={{ fontSize: '0.75rem', color: '#ca8a04', marginTop: '2px', fontWeight: 'bold' }}>
                Balance: {user.coins} (Worth ₹{maxCoinDiscount.toFixed(2)})
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <span style={{ fontWeight: 'bold', color: '#a16207', fontSize: '0.85rem' }}>Apply</span>
              <input 
                type="checkbox" 
                checked={useCoins} 
                onChange={(e) => setUseCoins(e.target.checked)}
                style={{ width: '20px', height: '20px', accentColor: '#eab308', cursor: 'pointer' }}
              />
            </label>
          </div>
        )}

        {/* 💵 FINAL BILL BREAKDOWN */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '15px', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '15px', color: '#0f172a' }}>Bill Details</div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.85rem', marginBottom: '8px' }}>
            <span>Item Total</span>
            <span>₹{itemTotal}</span>
          </div>
          
          {useCoins && discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '8px' }}>
              <span>Coin Discount (-{coinsUsed} Coins)</span>
              <span>- ₹{discount.toFixed(2)}</span>
            </div>
          )}
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', fontWeight: '900', color: '#0f172a', fontSize: '1.1rem' }}>
            <span>To Pay</span>
            <span>₹{finalBill.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* 🟢 STATUS MESSAGE TOAST */}
      {status && (
        <div style={{ position: 'fixed', bottom: '90px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#334155', color: 'white', padding: '12px 20px', borderRadius: '30px', fontWeight: 'bold', fontSize: '0.9rem', zIndex: 1000, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', whiteSpace: 'nowrap' }}>
          {status}
        </div>
      )}

      {/* STICKY CHECKOUT BUTTON */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'white', padding: '15px 20px', borderTop: '1px solid #e2e8f0', boxShadow: '0 -4px 10px rgba(0,0,0,0.05)', zIndex: 90 }}>
        <button 
          onClick={handleCheckout} 
          disabled={!targetShop || status.includes("⏳")}
          style={{ width: '100%', maxWidth: '800px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', backgroundColor: targetShop ? '#10b981' : '#cbd5e1', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '1.1rem', cursor: targetShop ? 'pointer' : 'not-allowed', boxShadow: targetShop ? '0 4px 10px rgba(16, 185, 129, 0.3)' : 'none', opacity: status.includes("⏳") ? 0.7 : 1 }}
        >
          <span>{status.includes("⏳") ? "Processing..." : "Place Order"}</span>
          <span>₹{finalBill.toFixed(2)}</span>
        </button>
      </div>

    </div>
  );
}

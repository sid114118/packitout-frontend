import React, { useState, useEffect } from 'react';
import Payment from './Payment.jsx'; 

export default function Cart({ cart, setCart, user, onBack, onCheckoutSuccess }) {
  const [targetShop, setTargetShop] = useState(null); 
  const [loadingShops, setLoadingShops] = useState(true);
  
  // 💳 Show Payment Screen State
  const [showPayment, setShowPayment] = useState(false);

  // 🪙 Coin Discount State
  const [useCoins, setUseCoins] = useState(false);

  // 🧮 BILL CALCULATIONS
  const itemTotal = cart.reduce((sum, item) => sum + ((item.sellingPrice || item.mrp) * item.qty), 0);
  
  const userCoinValueInRupees = (user?.coins || 0) / 10; 
  const maxDiscountAllowed = itemTotal * 0.10; 
  const maxUsableDiscount = Math.min(userCoinValueInRupees, maxDiscountAllowed);

  let rawDiscount = useCoins ? maxUsableDiscount : 0; 
  const discount = Number(rawDiscount.toFixed(2)); 
  const coinsUsed = Math.round(discount * 10); 
  const finalBill = Number((itemTotal - discount).toFixed(2));

  // --- 🛒 ADD/REMOVE ITEM LOGIC ---
  const updateQty = (productId, delta) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item._id === productId) {
          const newQty = item.qty + delta;
          return newQty > 0 ? { ...item, qty: newQty } : null; 
        }
        return item;
      }).filter(item => item !== null); 
    });
  };

  // 🕵️ Fetch Primary Shop
  useEffect(() => {
    if (user?.pincode) {
      setLoadingShops(true);
      fetch(`https://darkslategrey-snail-415133.hostingersite.com/shops/all/${user.pincode}`)
        .then(res => res.json())
        .then(data => {
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

  // --- EMPTY CART UI ---
  if (cart.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#f3f4f6', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '10px' }}>🛒</div>
        <h2 style={{ color: '#0f172a', marginBottom: '10px', fontWeight: '800' }}>Your cart is empty</h2>
        <p style={{ color: '#64748b', marginBottom: '24px' }}>Looks like you haven't added anything yet.</p>
        <button onClick={onBack} style={{ padding: '14px 32px', backgroundColor: '#0c831f', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 10px rgba(12, 131, 31, 0.2)' }}>
          Browse Products
        </button>
      </div>
    );
  }

  // 💳 ================= RENDER PAYMENT SCREEN ================= 💳
  if (showPayment) {
    return (
      <Payment 
        user={user}
        cart={cart}
        targetShop={targetShop}
        finalBill={finalBill}
        useCoins={useCoins}
        coinsUsed={coinsUsed}
        onBack={() => setShowPayment(false)} 
        onCheckoutSuccess={onCheckoutSuccess}
      />
    );
  }

  // 🛒 ================= CART SCREEN ================= 🛒
  return (
    // 🌟 FIX: Increased paddingBottom to 180px
    <div style={{ backgroundColor: '#f3f4f6', minHeight: '100vh', fontFamily: 'sans-serif', paddingBottom: '180px' }}>
      
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, backgroundColor: 'white', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '1px solid #e5e7eb', zIndex: 100 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#111827', display: 'flex', alignItems: 'center' }}>←</button>
        <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#111827', fontWeight: '800' }}>Checkout</h2>
      </div>

      <div style={{ padding: '16px', maxWidth: '800px', margin: '0 auto' }}>
        
        {/* 🏪 LOCKED SHOP SELECTION */}
        <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '12px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '800', marginBottom: '12px', letterSpacing: '0.5px' }}>
            📍 PICK-UP POINT ({user?.pincode})
          </div>
          
          {loadingShops ? (
            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '10px', color: '#64748b', textAlign: 'center', fontWeight: '600' }}>🔍 Confirming shop details...</div>
          ) : targetShop ? (
            <div style={{ backgroundColor: '#f4fbf6', border: '1.5px solid #22c55e', padding: '14px 16px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#111827', fontSize: '1.05rem', fontWeight: '800' }}>
                  {targetShop.name}
                  <span style={{ backgroundColor: '#fef08a', color: '#a16207', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', fontWeight: '800' }}>⭐ Primary</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '4px', fontWeight: '500' }}>Ready in 10-15 mins</div>
              </div>
              <div style={{ backgroundColor: '#22c55e', color: 'white', width: '26px', height: '26px', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '6px', fontSize: '1rem', fontWeight: '900', boxShadow: '0 2px 4px rgba(34, 197, 94, 0.3)' }}>
                ✓
              </div>
            </div>
          ) : (
            <div style={{ padding: '16px', background: '#fef2f2', color: '#b91c1c', borderRadius: '10px', fontSize: '0.9rem', fontWeight: '600' }}>
              ❌ No shops found in your pincode. Please update your profile.
            </div>
          )}
        </div>

        {/* 🛒 ITEM SUMMARY */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '16px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ fontWeight: '800', fontSize: '1.05rem', marginBottom: '16px', color: '#111827' }}>Review Items</div>
          
          {cart.map((item, index) => (
            <div key={item._id} style={{ display: 'flex', gap: '15px', alignItems: 'center', paddingBottom: '16px', marginBottom: '16px', borderBottom: index === cart.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
              
              <div style={{ width: '60px', height: '60px', backgroundColor: '#f8fafc', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid #f1f5f9' }}>
                {item.image ? <img src={item.image} style={{ maxWidth: '48px', maxHeight: '48px', objectFit: 'contain' }} alt={item.name} /> : <span style={{ fontSize: '30px' }}>{item.emoji}</span>}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '700', color: '#111827', fontSize: '0.9rem', lineHeight: '1.25', marginBottom: '4px' }}>{item.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '6px', fontWeight: '500' }}>{item.qnty}</div>
                <div style={{ fontWeight: '800', color: '#111827', fontSize: '0.95rem' }}>₹{item.sellingPrice || item.mrp}</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#0c831f', borderRadius: '8px', height: '32px', width: '80px', boxShadow: '0 2px 6px rgba(12, 131, 31, 0.2)' }}>
                <button onClick={() => updateQty(item._id, -1)} style={{ flex: 1, height: '100%', border: 'none', background: 'transparent', color: '#fff', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                <span style={{ color: '#fff', fontSize: '0.95rem', fontWeight: '800', minWidth: '20px', textAlign: 'center' }}>{item.qty}</span>
                <button onClick={() => updateQty(item._id, 1)} style={{ flex: 1, height: '100%', border: 'none', background: 'transparent', color: '#fff', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
              </div>

            </div>
          ))}
        </div>

        {/* 🪙 COIN DISCOUNT TOGGLE WITH CAP UI */}
        {user?.coins > 0 && (
          <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '12px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #fef08a', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div>
              <strong style={{ color: '#a16207', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem', fontWeight: '800' }}>🪙 PackIt Coins</strong>
              <div style={{ fontSize: '0.75rem', color: '#ca8a04', marginTop: '4px', fontWeight: '600' }}>
                Balance: {Math.round(user.coins)} • Max usable: ₹{maxUsableDiscount.toFixed(2)}
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <span style={{ fontWeight: '800', color: '#a16207', fontSize: '0.85rem' }}>Apply</span>
              <input 
                type="checkbox" 
                checked={useCoins} 
                onChange={(e) => setUseCoins(e.target.checked)}
                style={{ width: '22px', height: '22px', accentColor: '#eab308', cursor: 'pointer' }}
              />
            </label>
          </div>
        )}

        {/* 💵 FINAL BILL BREAKDOWN */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ fontWeight: '800', fontSize: '1.05rem', marginBottom: '16px', color: '#111827' }}>Bill Details</div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563', fontSize: '0.85rem', marginBottom: '10px', fontWeight: '500' }}>
            <span>Item Total</span>
            <span style={{ color: '#111827', fontWeight: '600' }}>₹{itemTotal.toFixed(2)}</span>
          </div>
          
          {useCoins && discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0c831f', fontWeight: '700', fontSize: '0.85rem', marginBottom: '10px' }}>
              <span>Coin Discount (-{coinsUsed} Coins)</span>
              <span>- ₹{discount.toFixed(2)}</span>
            </div>
          )}
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '14px', paddingTop: '14px', borderTop: '1px dashed #cbd5e1', fontWeight: '900', color: '#111827', fontSize: '1.1rem' }}>
            <span>To Pay</span>
            <span>₹{finalBill.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* 🌟 FIX: Moved bottom to 70px so it sits beautifully above the Nav Bar! */}
      <div style={{ position: 'fixed', bottom: '70px', left: 0, right: 0, backgroundColor: 'white', padding: '12px 16px', borderTop: '1px solid #e5e7eb', boxShadow: '0 -4px 10px rgba(0,0,0,0.03)', zIndex: 90 }}>
        <button 
          onClick={() => setShowPayment(true)} 
          disabled={!targetShop}
          style={{ width: '100%', maxWidth: '800px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', backgroundColor: targetShop ? '#0c831f' : '#cbd5e1', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '900', fontSize: '1.1rem', cursor: targetShop ? 'pointer' : 'not-allowed', boxShadow: targetShop ? '0 4px 12px rgba(12, 131, 31, 0.3)' : 'none', transition: 'all 0.2s ease' }}
        >
          <span>Select Payment</span>
          <span>₹{finalBill.toFixed(2)} ➔</span>
        </button>
      </div>

    </div>
  );
        }

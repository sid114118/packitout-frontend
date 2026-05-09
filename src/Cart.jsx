import React, { useState, useEffect } from 'react';
import Payment from './Payment.jsx';
import useScrollToTop from './useScrollToTop';
import { cdnImage } from './utils/cloudinaryUrl.js';

// 🚀 FIX: The "export default" is right here so App.jsx can read it!
export default function Cart({ cart, setCart, user, onBack, onCheckoutSuccess }) {
  useScrollToTop(); 

  const [targetShop, setTargetShop] = useState(null); 
  const [loadingShops, setLoadingShops] = useState(true);
  
  // 💳 Show Payment Screen State
  const [showPayment, setShowPayment] = useState(false);

  // 🪙 Coin Discount State
  const [useCoins, setUseCoins] = useState(false);

  // 🧮 BILL CALCULATIONS
  const totalMRP = cart.reduce((sum, item) => {
    if (!item) return sum;
    const safeQty = item.qty || 1;
    const originalPrice = (item.mrp && item.mrp > 0) ? item.mrp : (item.sellingPrice || 0);
    return sum + (originalPrice * safeQty);
  }, 0);

  const itemTotal = cart.reduce((sum, item) => {
    if (!item) return sum; 
    const safeQty = item.qty || 1; 
    const safePrice = item.sellingPrice !== undefined ? item.sellingPrice : (item.mrp || 0);
    return sum + (safePrice * safeQty);
  }, 0);

  const totalProductDiscount = totalMRP - itemTotal;
  
  const userCoinValueInRupees = (user?.coins || 0) / 10; 
  const maxDiscountAllowed = itemTotal * 0.10; 
  const maxUsableDiscount = Math.min(userCoinValueInRupees, maxDiscountAllowed);

  let rawDiscount = useCoins ? maxUsableDiscount : 0; 
  const discount = Number(rawDiscount.toFixed(2)); 
  const coinsUsed = Math.round(discount * 10); 
  
  const finalBill = Number((itemTotal - discount).toFixed(2));
  const totalSavings = totalProductDiscount + discount;

  // --- 🛒 ADD/REMOVE ITEM LOGIC ---
  const updateQty = (productId, delta) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item && item._id === productId) {
          const currentQty = item.qty || 1; 
          const newQty = currentQty + delta;
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

  // --- EMPTY CART UI (Premium Redesign) ---
  if (!cart || cart.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#f4f6f8', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ fontSize: '5rem', marginBottom: '15px', filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))' }}>🛒</div>
        <h2 style={{ color: '#0f172a', marginBottom: '8px', fontWeight: '900', fontSize: '1.4rem' }}>Your cart is empty</h2>
        <p style={{ color: '#64748b', marginBottom: '30px', fontWeight: '500' }}>Looks like you haven't added anything yet.</p>
        <button onClick={onBack} style={{ padding: '14px 32px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', fontSize: '1.05rem', cursor: 'pointer', boxShadow: '0 8px 20px rgba(22, 163, 74, 0.3)', transition: 'transform 0.2s' }}>
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

  // 🛒 ================= CART SCREEN (Premium Redesign) ================= 🛒
  return (
    <div style={{ backgroundColor: '#f4f6f8', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif', paddingBottom: '180px' }}>
      
      {/* Premium Sticky Header */}
      <div style={{ position: 'sticky', top: 0, backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '15px', zIndex: 100, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#0f172a', display: 'flex', alignItems: 'center' }}>←</button>
        <h2 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: '800', letterSpacing: '-0.3px' }}>Checkout</h2>
      </div>

      <div style={{ padding: '16px', maxWidth: '800px', margin: '0 auto' }}>
        
        {/* 🏪 LOCKED SHOP SELECTION */}
        <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '20px', marginBottom: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '800', marginBottom: '12px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            📍 Delivering To ({user?.pincode})
          </div>
          
          {loadingShops ? (
            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', color: '#64748b', textAlign: 'center', fontWeight: '600' }}>🔍 Confirming shop details...</div>
          ) : targetShop ? (
            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '14px 16px', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontSize: '1.05rem', fontWeight: '800' }}>
                  {targetShop.name}
                  <span style={{ backgroundColor: '#fef08a', color: '#854d0e', fontSize: '0.65rem', padding: '3px 8px', borderRadius: '6px', fontWeight: '800' }}>⭐ Primary</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#16a34a', marginTop: '4px', fontWeight: '700' }}>Ready in 10-15 mins</div>
              </div>
              <div style={{ backgroundColor: '#16a34a', color: 'white', width: '28px', height: '28px', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '8px', fontSize: '1.1rem', fontWeight: '900', boxShadow: '0 4px 10px rgba(22, 163, 74, 0.2)' }}>
                ✓
              </div>
            </div>
          ) : (
            <div style={{ padding: '16px', background: '#fef2f2', color: '#b91c1c', borderRadius: '14px', fontSize: '0.9rem', fontWeight: '700', border: '1px solid #fecaca' }}>
              ❌ No shops found in your pincode. Please update your profile.
            </div>
          )}
        </div>

        {/* 🛒 ITEM SUMMARY */}
        <div style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '20px 16px', marginBottom: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          <div style={{ fontWeight: '800', fontSize: '1.1rem', marginBottom: '20px', color: '#0f172a' }}>Review Items</div>
          
          {cart.map((item, index) => {
            if (!item) return null; 
            
            const safeQty = item.qty || 1;
            const safePrice = item.sellingPrice !== undefined ? item.sellingPrice : (item.mrp || 0);
            const originalPrice = (item.mrp && item.mrp > 0) ? item.mrp : safePrice;
            const isDiscounted = originalPrice > safePrice;
            
            return (
              <div key={`${item._id}-${index}`} style={{ display: 'flex', gap: '15px', alignItems: 'center', paddingBottom: '20px', marginBottom: '20px', borderBottom: index === cart.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                
                {/* Product Image Squircle */}
                <div style={{ width: '65px', height: '65px', backgroundColor: '#f8fafc', borderRadius: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid rgba(0,0,0,0.02)', position: 'relative', flexShrink: 0 }}>
                  {isDiscounted && <span style={{ position: 'absolute', top: '-6px', left: '-6px', backgroundColor: '#ef4444', color: '#fff', fontSize: '0.55rem', fontWeight: '900', padding: '3px 6px', borderRadius: '6px', zIndex: 1 }}>OFFER</span>}
                  {item.image ? <img src={cdnImage(item.image, 200)} loading="lazy" decoding="async" style={{ maxWidth: '80%', maxHeight: '80%', objectFit: 'contain', mixBlendMode: 'multiply' }} alt={item.name} /> : <span style={{ fontSize: '30px' }}>{item.emoji}</span>}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.9rem', lineHeight: '1.25', marginBottom: '4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '6px', fontWeight: '600' }}>{item.qnty}</div>
                  
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '1rem' }}>₹{safePrice}</div>
                    {isDiscounted && (
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8', textDecoration: 'line-through', fontWeight: '600' }}>₹{originalPrice}</div>
                    )}
                  </div>
                </div>

                {/* Modern Plus/Minus Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#ef4444', borderRadius: '10px', height: '36px', width: '85px', boxShadow: '0 4px 10px rgba(239, 68, 68, 0.2)' }}>
                  <button onClick={() => updateQty(item._id, -1)} style={{ flex: 1, height: '100%', border: 'none', background: 'transparent', color: '#fff', fontSize: '1.4rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                  <span style={{ color: '#fff', fontSize: '0.95rem', fontWeight: '800', minWidth: '20px', textAlign: 'center' }}>{safeQty}</span>
                  <button onClick={() => updateQty(item._id, 1)} style={{ flex: 1, height: '100%', border: 'none', background: 'transparent', color: '#fff', fontSize: '1.4rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                </div>

              </div>
            );
          })}
        </div>

        {/* 🪙 COIN DISCOUNT TOGGLE */}
        {user?.coins > 0 && (
          <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #fef08a', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
            <div>
              <strong style={{ color: '#854d0e', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem', fontWeight: '800' }}>🪙 PackIt Coins</strong>
              <div style={{ fontSize: '0.75rem', color: '#ca8a04', marginTop: '4px', fontWeight: '700' }}>
                Balance: {Math.round(user.coins)} • Max usable: ₹{maxUsableDiscount.toFixed(2)}
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <span style={{ fontWeight: '800', color: '#a16207', fontSize: '0.9rem' }}>Apply</span>
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
        <div style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '20px 16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          <div style={{ fontWeight: '800', fontSize: '1.1rem', marginBottom: '16px', color: '#0f172a' }}>Bill Details</div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.9rem', marginBottom: '12px', fontWeight: '600' }}>
            <span>Total MRP</span>
            <span>₹{totalMRP.toFixed(2)}</span>
          </div>

          {totalProductDiscount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a', fontSize: '0.9rem', marginBottom: '12px', fontWeight: '700' }}>
              <span>Item Discount</span>
              <span>- ₹{totalProductDiscount.toFixed(2)}</span>
            </div>
          )}
          
          {useCoins && discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a', fontWeight: '700', fontSize: '0.9rem', marginBottom: '12px' }}>
              <span>Coin Discount (-{coinsUsed} Coins)</span>
              <span>- ₹{discount.toFixed(2)}</span>
            </div>
          )}
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed #cbd5e1', fontWeight: '900', color: '#0f172a', fontSize: '1.2rem' }}>
            <span>To Pay</span>
            <span>₹{finalBill.toFixed(2)}</span>
          </div>

          {/* 🎉 CELEBRATION BANNER */}
          {totalSavings > 0 && (
            <div style={{ marginTop: '20px', backgroundColor: '#f0fdf4', color: '#166534', padding: '12px', borderRadius: '12px', textAlign: 'center', fontSize: '0.85rem', fontWeight: '800', border: '1px solid #bbf7d0' }}>
              🎉 You are saving ₹{totalSavings.toFixed(2)} on this order!
            </div>
          )}
        </div>
      </div>

      {/* Modern Floating Checkout Button */}
      <div style={{ position: 'fixed', bottom: '65px', left: 0, right: 0, backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)', padding: '16px', borderTop: '1px solid rgba(0,0,0,0.05)', zIndex: 999 }}>
        <button 
          onClick={() => setShowPayment(true)} 
          disabled={!targetShop}
          style={{ width: '100%', maxWidth: '800px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', backgroundColor: targetShop ? '#16a34a' : '#cbd5e1', color: 'white', border: 'none', borderRadius: '16px', fontWeight: '900', fontSize: '1.15rem', cursor: targetShop ? 'pointer' : 'not-allowed', boxShadow: targetShop ? '0 8px 25px rgba(22, 163, 74, 0.35)' : 'none', transition: 'all 0.2s ease' }}
        >
          <span>Select Payment</span>
          <span>₹{finalBill.toFixed(2)} ›</span>
        </button>
      </div>

    </div>
  );
                       }

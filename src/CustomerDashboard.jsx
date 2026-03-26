import React, { useState, useEffect } from 'react';

export default function CustomerDashboard({ user, onExit }) {
  const [shopMenu, setShopMenu] = useState(null);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  const BASE_URL = "https://darkslategrey-snail-415133.hostingersite.com";

  useEffect(() => {
    // Check if user has selected a primary shop
    if (user?.primaryShop) {
      // Sometimes primaryShop is populated (object), sometimes it's just an ID
      const shopId = typeof user.primaryShop === 'object' ? user.primaryShop._id : user.primaryShop;
      fetchShopMenu(shopId);
    } else {
      setLoading(false); 
    }
  }, [user]);

  const fetchShopMenu = async (shopId) => {
    try {
      const res = await fetch(`${BASE_URL}/shops/${shopId}/menu`);
      setShopMenu(await res.json());
    } catch (err) {
      console.log(err);
    }
    setLoading(false);
  };

  // 🛒 Cart Logic
  const addToCart = (item) => {
    const existing = cart.find(c => c.productId === item.product._id);
    
    // 🛡️ Safe Price Logic: Use sellingPrice if it exists, otherwise fallback to Master MRP
    const activePrice = item.sellingPrice || item.product.mrp; 

    if (existing) {
      setCart(cart.map(c => c.productId === item.product._id ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { 
        productId: item.product._id, 
        name: item.product.name, 
        price: activePrice, 
        qty: 1 
      }]);
    }
  };

  const removeFromCart = (productId) => {
    const existing = cart.find(c => c.productId === productId);
    if (existing.qty === 1) {
      setCart(cart.filter(c => c.productId !== productId));
    } else {
      setCart(cart.map(c => c.productId === productId ? { ...c, qty: c.qty - 1 } : c));
    }
  };

  const getCartTotal = () => cart.reduce((total, item) => total + (item.price * item.qty), 0);
  const getCartCount = () => cart.reduce((total, item) => total + item.qty, 0);

  // 🚀 Checkout Logic
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    try {
      const orderData = {
        userId: user._id,
        shopId: shopMenu._id,
        items: cart,
        totalAmount: getCartTotal(),
        status: "Pending"
      };

      const res = await fetch(`${BASE_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData)
      });

      if (res.ok) {
        alert("✅ Order placed successfully! The shopkeeper has been notified.");
        setCart([]); // Clear cart after successful order
      }
    } catch (err) {
      alert("Error placing order. Please try again.");
    }
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>Loading your local store...</div>;

  if (!shopMenu) return (
    <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <h2 style={{ color: '#0f172a' }}>Welcome, {user.name}! 👋</h2>
      <p style={{ color: '#64748b', lineHeight: '1.6', marginBottom: '30px' }}>
        You haven't selected a local store yet. Please update your Pincode and select a Primary Shop in your profile to start shopping.
      </p>
      <button onClick={onExit} style={actionBtnStyle}>Go Back</button>
    </div>
  );

  // Filter out items that are manually marked "Out of Stock" or have broken product links
  const availableItems = shopMenu.inventory?.filter(item => item.inStock && item.product) || [];

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '100px', fontFamily: 'sans-serif' }}>
      
      {/* 🏬 STORE HEADER (Sticky) */}
      <div style={{ backgroundColor: '#10b981', color: 'white', padding: '20px', borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{shopMenu.name}</h2>
            <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', opacity: 0.9 }}>📍 Delivery to {user.pincode}</p>
            {!shopMenu.isOpen && <span style={{ backgroundColor: '#ef4444', color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', marginTop: '10px', display: 'inline-block' }}>Currently Closed</span>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '5px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '10px', display: 'inline-block' }}>
              🪙 {user.coins} Coins
            </div>
            <br />
            <button onClick={onExit} style={{ background: 'white', color: '#10b981', border: 'none', padding: '6px 14px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>Logout</button>
          </div>
        </div>
      </div>

      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <h3 style={{ color: '#0f172a', marginBottom: '20px' }}>Freshly Stocked Items</h3>

        {availableItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', backgroundColor: 'white', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
            This store hasn't added any products to their digital shelves yet!
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '15px' }}>
            {availableItems.map(item => {
              const inCart = cart.find(c => c.productId === item.product._id);
              
              // 🛡️ The Math for Pricing and Discounts
              const mrp = item.product.mrp;
              const currentPrice = item.sellingPrice || mrp; 
              const isDiscounted = currentPrice < mrp;
              const discountPercent = isDiscounted ? Math.round(((mrp - currentPrice) / mrp) * 100) : 0;

              return (
                <div key={item._id} style={productCardStyle}>
                  {/* Image Container with Relative Positioning for the Badge */}
                  <div style={{ height: '110px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', borderRadius: '8px', marginBottom: '10px', position: 'relative' }}>
                    
                    {/* 💥 THE DISTINCT DISCOUNT BADGE */}
                    {isDiscounted && (
                      <div style={{ position: 'absolute', top: '-8px', left: '-8px', backgroundColor: '#ef4444', color: 'white', fontSize: '0.75rem', fontWeight: 'bold', padding: '4px 8px', borderRadius: '6px', boxShadow: '0 2px 4px rgba(239, 68, 68, 0.4)', zIndex: 10 }}>
                        {discountPercent}% OFF
                      </div>
                    )}

                    {item.product.image ? <img src={item.product.image} style={{ maxHeight: '90px', maxWidth: '100%', objectFit: 'contain' }} alt={item.product.name} /> : <span style={{fontSize: '40px'}}>{item.product.emoji}</span>}
                  </div>
                  
                  {/* Product Details */}
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.5px' }}>{item.product.brand}</div>
                  <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '0.95rem', marginBottom: '5px', height: '40px', overflow: 'hidden', lineHeight: '1.2' }}>{item.product.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '10px' }}>{item.product.qnty}</div>
                  
                  {/* Pricing Display */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                    <span style={{ fontWeight: '900', fontSize: '1.25rem', color: '#0f172a' }}>₹{currentPrice}</span>
                    {isDiscounted && <span style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: '0.9rem' }}>₹{mrp}</span>}
                  </div>

                  {/* Add to Cart Controls */}
                  {inCart ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#10b981', color: 'white', borderRadius: '8px', padding: '6px', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)' }}>
                      <button onClick={() => removeFromCart(item.product._id)} style={qtyBtnStyle}>-</button>
                      <span style={{ fontSize: '1.1rem' }}>{inCart.qty}</span>
                      <button onClick={() => addToCart(item)} style={qtyBtnStyle}>+</button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => addToCart(item)} 
                      disabled={!shopMenu.isOpen}
                      style={{ 
                        width: '100%', padding: '10px', 
                        backgroundColor: shopMenu.isOpen ? 'white' : '#f1f5f9', 
                        color: shopMenu.isOpen ? '#10b981' : '#cbd5e1', 
                        border: `2px solid ${shopMenu.isOpen ? '#10b981' : '#cbd5e1'}`, 
                        borderRadius: '8px', fontWeight: 'bold', 
                        cursor: shopMenu.isOpen ? 'pointer' : 'not-allowed', 
                        transition: '0.2s', textTransform: 'uppercase', letterSpacing: '1px'
                      }}
                    >
                      {shopMenu.isOpen ? "Add" : "Closed"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 🛍️ FLOATING CART BAR */}
      {cart.length > 0 && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'white', padding: '15px 20px', boxShadow: '0 -4px 20px rgba(0,0,0,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1000 }}>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>{getCartCount()} Items</div>
            <div style={{ fontSize: '1.3rem', fontWeight: '900', color: '#0f172a' }}>₹{getCartTotal()}</div>
          </div>
          <button onClick={handleCheckout} style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.4)' }}>
            Place Order ➔
          </button>
        </div>
      )}

    </div>
  );
}

// Styling Helpers
const productCardStyle = { backgroundColor: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' };
const qtyBtnStyle = { background: 'none', border: 'none', color: 'white', fontSize: '1.4rem', cursor: 'pointer', padding: '0 12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const actionBtnStyle = { padding: '12px 24px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginTop: '20px', fontSize: '1rem' };
                     

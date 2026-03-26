import React, { useState, useEffect } from 'react';

export default function CustomerDashboard({ user, onExit }) {
  const [shopMenu, setShopMenu] = useState(null);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  const BASE_URL = "https://darkslategrey-snail-415133.hostingersite.com";

  useEffect(() => {
    if (user?.primaryShop) {
      fetchShopMenu(user.primaryShop._id || user.primaryShop);
    } else {
      setLoading(false); // No shop selected yet
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
    if (existing) {
      setCart(cart.map(c => c.productId === item.product._id ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { 
        productId: item.product._id, 
        name: item.product.name, 
        price: item.sellingPrice, 
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
        setCart([]); // Clear cart
      }
    } catch (err) {
      alert("Error placing order.");
    }
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Loading your local store...</div>;

  if (!shopMenu) return (
    <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h2>Welcome, {user.name}! 👋</h2>
      <p>You haven't selected a local store yet. Please update your Pincode and select a Primary Shop in your profile.</p>
      <button onClick={onExit} style={actionBtnStyle}>Go Back</button>
    </div>
  );

  // Filter out items that are marked "Out of Stock" or have broken product links
  const availableItems = shopMenu.inventory?.filter(item => item.inStock && item.product) || [];

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '100px', fontFamily: 'sans-serif' }}>
      
      {/* 🏬 STORE HEADER */}
      <div style={{ backgroundColor: '#10b981', color: 'white', padding: '20px', borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{shopMenu.name}</h2>
            <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', opacity: 0.9 }}>📍 Delivery to {user.pincode}</p>
            {!shopMenu.isOpen && <span style={{ backgroundColor: '#ef4444', color: 'white', padding: '3px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', marginTop: '10px', display: 'inline-block' }}>Currently Closed</span>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '5px 10px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '10px' }}>
              🪙 {user.coins} Coins
            </div>
            <button onClick={onExit} style={{ background: 'white', color: '#10b981', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Logout</button>
          </div>
        </div>
      </div>

      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <h3 style={{ color: '#0f172a', marginBottom: '20px' }}>Freshly Stocked Items ({availableItems.length})</h3>

        {availableItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', backgroundColor: 'white', borderRadius: '12px' }}>
            This store hasn't added any products yet!
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '15px' }}>
            {availableItems.map(item => {
              const inCart = cart.find(c => c.productId === item.product._id);
              const isDiscounted = item.sellingPrice < item.product.mrp;

              return (
                <div key={item._id} style={productCardStyle}>
                  {/* Image */}
                  <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', borderRadius: '8px', marginBottom: '10px' }}>
                    {item.product.image ? <img src={item.product.image} style={{ maxHeight: '80px', maxWidth: '100%', objectFit: 'contain' }} alt={item.product.name} /> : <span style={{fontSize: '40px'}}>{item.product.emoji}</span>}
                  </div>
                  
                  {/* Product Details */}
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>{item.product.brand}</div>
                  <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '0.95rem', marginBottom: '5px', height: '40px', overflow: 'hidden' }}>{item.product.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '10px' }}>{item.product.qnty}</div>
                  
                  {/* Pricing (With Discount Logic) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#0f172a' }}>₹{item.sellingPrice}</span>
                    {isDiscounted && <span style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: '0.85rem' }}>₹{item.product.mrp}</span>}
                  </div>

                  {/* Add to Cart Controls */}
                  {inCart ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#10b981', color: 'white', borderRadius: '8px', padding: '5px', fontWeight: 'bold' }}>
                      <button onClick={() => removeFromCart(item.product._id)} style={qtyBtnStyle}>-</button>
                      <span>{inCart.qty}</span>
                      <button onClick={() => addToCart(item)} style={qtyBtnStyle}>+</button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => addToCart(item)} 
                      disabled={!shopMenu.isOpen}
                      style={{ width: '100%', padding: '8px', backgroundColor: shopMenu.isOpen ? 'white' : '#f1f5f9', color: shopMenu.isOpen ? '#10b981' : '#cbd5e1', border: `1px solid ${shopMenu.isOpen ? '#10b981' : '#cbd5e1'}`, borderRadius: '8px', fontWeight: 'bold', cursor: shopMenu.isOpen ? 'pointer' : 'not-allowed' }}
                    >
                      {shopMenu.isOpen ? "ADD" : "CLOSED"}
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
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'white', padding: '15px 20px', boxShadow: '0 -4px 15px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1000 }}>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>{getCartCount()} ITEMS</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#0f172a' }}>₹{getCartTotal()}</div>
          </div>
          <button onClick={handleCheckout} style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px rgba(16, 185, 129, 0.3)' }}>
            Place Order ➔
          </button>
        </div>
      )}

    </div>
  );
}

// Styling Helpers
const productCardStyle = { backgroundColor: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' };
const qtyBtnStyle = { background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer', padding: '0 10px', fontWeight: 'bold' };
const actionBtnStyle = { padding: '10px 20px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginTop: '20px' };

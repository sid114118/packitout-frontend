import React, { useState, useEffect } from 'react';
import Header from './Header.jsx';
import Categories from './Categories.jsx';
// Removed the Footer import!

import AdminDashboard from './AdminDashboard.jsx';
import AdminLogin from './AdminLogin.jsx';
import ShopDashboard from './ShopDashboard.jsx';
import ShopLogin from './ShopLogin.jsx';
import UserDashboard from './UserDashboard.jsx';
import UserAuth from './UserAuth.jsx';
import ProductFeed from './ProductFeed.jsx';
import Cart from './Cart.jsx';

export default function App() {
  const [currentView, setCurrentView] = useState("customer");
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isShopAuthenticated, setIsShopAuthenticated] = useState(null);
  
  const [selectedCategory, setSelectedCategory] = useState(null); 
  const [searchQuery, setSearchQuery] = useState("");
  
  const [loggedInUser, setLoggedInUser] = useState(() => {
    const saved = localStorage.getItem("packitout_user");
    return saved ? JSON.parse(saved) : null;
  });

  // 🛒 SMART CART
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem("packitout_cart");
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem("packitout_cart", JSON.stringify(cart));
  }, [cart]);

  const handleAddToCart = (product) => {
    if (!loggedInUser) {
      alert("Please log in or sign up to add items to your cart! 🛒");
      window.location.hash = "#account";
      return;
    }
    setCart((prevCart) => {
      const existingItem = prevCart.find(item => item._id === product._id);
      if (existingItem) {
        return prevCart.map(item => item._id === product._id ? { ...item, qty: item.qty + 1 } : item);
      } else {
        return [...prevCart, { ...product, qty: 1 }];
      }
    });
  };

  const handleRemoveFromCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(item => item._id === product._id);
      if (!existingItem) return prevCart;
      
      if (existingItem.qty > 1) {
        return prevCart.map(item => item._id === product._id ? { ...item, qty: item.qty - 1 } : item);
      } else {
        return prevCart.filter(item => item._id !== product._id);
      }
    });
  };

  useEffect(() => {
    const checkUrl = () => {
      if (window.location.hash === "#admin") setCurrentView("admin");
      else if (window.location.hash === "#shop") setCurrentView("shop");
      else if (window.location.hash === "#account") setCurrentView("account");
      else if (window.location.hash === "#cart") setCurrentView("cart");
      else {
        setCurrentView("customer");
        setSelectedCategory(null);
        setSearchQuery(""); 
      }
    };
    checkUrl();
    window.addEventListener("hashchange", checkUrl);
    return () => window.removeEventListener("hashchange", checkUrl);
  }, []);

  const handleUserLogin = (userData) => {
    localStorage.setItem("packitout_user", JSON.stringify(userData));
    setLoggedInUser(userData);
    window.location.hash = "";
  };

  const handleUserLogout = () => {
    localStorage.removeItem("packitout_user");
    setLoggedInUser(null);
    setCart([]); 
    window.location.hash = "";
  };

  if (currentView === "admin") {
    if (!isAdminAuthenticated) return <AdminLogin onLogin={() => setIsAdminAuthenticated(true)} />;
    return <AdminDashboard onExit={() => { setIsAdminAuthenticated(false); window.location.hash = ""; }} />;
  }

  if (currentView === "shop") {
    if (!isShopAuthenticated) return <ShopLogin onLogin={(shopData) => setIsShopAuthenticated(shopData)} />;
    return <ShopDashboard user={isShopAuthenticated} onExit={() => { setIsShopAuthenticated(null); window.location.hash = ""; }} />;
  }

  if (currentView === "account") {
    if (!loggedInUser) return <UserAuth onLoginSuccess={handleUserLogin} />;
    return <UserDashboard user={loggedInUser} onExit={() => window.location.hash = ""} onLogout={handleUserLogout} />;
  }

  if (currentView === "cart") {
    return <Cart cart={cart} setCart={setCart} user={loggedInUser} onBack={() => window.location.hash = ""} onCheckoutSuccess={() => { setCart([]); window.location.hash = "#account"; }} />;
  }

  const cartTotalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const cartTotalPrice = cart.reduce((sum, item) => sum + (item.mrp * item.qty), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', fontFamily: 'sans-serif', backgroundColor: '#f3f4f6', paddingBottom: cart.length > 0 ? '80px' : '0' }}>
      
      <Header user={loggedInUser} />

      <div style={{ position: 'sticky', top: 0, zIndex: 100, backgroundColor: '#f3f4f6', padding: '10px 15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: '12px', padding: '10px 15px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
          <input 
            type="text" 
            placeholder='Search "Maggi", "Milk", "Chips"...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ border: 'none', outline: 'none', width: '100%', fontSize: '1rem', color: '#0f172a', backgroundColor: 'transparent' }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: '#94a3b8', cursor: 'pointer' }}>✖</button>
          )}
        </div>
      </div>
      
      {loggedInUser && loggedInUser.primaryShop && typeof loggedInUser.primaryShop === 'object' && !searchQuery && !selectedCategory && (
        <div style={{ margin: '5px 15px 15px 15px', backgroundColor: '#ffffff', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.03)', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' }}>Shopping From</span>
            <strong style={{ color: '#0f172a', fontSize: '1.05rem', marginTop: '2px' }}>{loggedInUser.primaryShop.name}</strong>
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 'bold', padding: '6px 12px', borderRadius: '8px', backgroundColor: loggedInUser.primaryShop.isOpen ? '#d1fae5' : '#fee2e2', color: loggedInUser.primaryShop.isOpen ? '#059669' : '#b91c1c', border: `1px solid ${loggedInUser.primaryShop.isOpen ? '#a7f3d0' : '#fecaca'}` }}>
            {loggedInUser.primaryShop.isOpen ? '🟢 OPEN' : '🔴 CLOSED'}
          </div>
        </div>
      )}

      {!selectedCategory && !searchQuery && <Categories onCategorySelect={setSelectedCategory} />}
      
      <main style={{ flex: 1, padding: '1rem 0 3rem 0', textAlign: 'center' }}>
        <ProductFeed 
          user={loggedInUser} 
          cart={cart}
          onAddToCart={handleAddToCart} 
          onRemoveFromCart={handleRemoveFromCart}
          onViewCart={() => window.location.hash = "#cart"}
          selectedCategory={selectedCategory} 
          onClearCategory={() => setSelectedCategory(null)} 
          searchQuery={searchQuery}
        />
        {/* ✂️ Removed the floating User Profile button! */}
      </main>
      
      {/* ✂️ Removed the Footer! */}

      {/* 🌟 PREMIUM BLINKIT-STYLE GLOBAL CART 🌟 */}
      {cart.length > 0 && (
        <div
          onClick={() => window.location.hash = "#cart"}
          style={{ position: 'fixed', bottom: '20px', left: '12px', right: '12px', zIndex: 1000, backgroundColor: '#0c831f', color: '#fff', padding: '10px 14px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', boxShadow: '0 4px 20px rgba(12, 131, 31, 0.3)', animation: 'fadeIn 0.2s ease' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', width: '38px', height: '38px', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.2rem' }}>
              🛒
            </div>
            <div style={{ textAlign: 'left', lineHeight: '1.3' }}>
              <div style={{ fontWeight: '600', fontSize: '0.75rem', opacity: 0.95 }}>
                {cartTotalItems} item{cartTotalItems > 1 ? 's' : ''}
              </div>
              <div style={{ fontWeight: '800', fontSize: '1rem' }}>₹ {cartTotalPrice}</div>
            </div>
          </div>
          <div style={{ fontWeight: '800', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
            View Cart <span style={{ fontSize: '1.2rem' }}>▶</span>
          </div>
        </div>
      )}
    </div>
  );
            }

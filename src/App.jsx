import React, { useState, useEffect } from 'react';
import Header from './Header.jsx';
import Categories from './Categories.jsx';
import Footer from './Footer.jsx';

import AdminDashboard from './AdminDashboard.jsx';
import AdminLogin from './AdminLogin.jsx';
import ShopDashboard from './ShopDashboard.jsx';
import ShopLogin from './ShopLogin.jsx';
import UserDashboard from './UserDashboard.jsx';
import UserAuth from './UserAuth.jsx';
import ProductFeed from './ProductFeed/productfeed';
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

  const [cart, setCart] = useState([]);

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
    return <Cart cart={cart} user={loggedInUser} onBack={() => window.location.hash = ""} onCheckoutSuccess={() => { setCart([]); window.location.hash = "#account"; }} />;
  }

  const cartTotalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const cartTotalPrice = cart.reduce((sum, item) => sum + (item.mrp * item.qty), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', fontFamily: 'sans-serif', backgroundColor: '#f4f7f6', paddingBottom: cart.length > 0 ? '80px' : '0' }}>
      
      <Header user={loggedInUser} />

      {/* 🔍 THE GLOBAL SEARCH BAR (Icon Removed!) */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, backgroundColor: '#f4f7f6', padding: '10px 15px' }}>
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
      
      {!selectedCategory && !searchQuery && <Categories onCategorySelect={setSelectedCategory} />}
      
      <main style={{ flex: 1, padding: '1rem 0 3rem 0', textAlign: 'center' }}>
        
        <ProductFeed 
          user={loggedInUser} 
          onAddToCart={handleAddToCart} 
          selectedCategory={selectedCategory} 
          onClearCategory={() => setSelectedCategory(null)} 
          searchQuery={searchQuery}
        />
        
        <button onClick={() => window.location.hash = "#account"} style={{ marginTop: '30px', padding: '12px 24px', backgroundColor: '#2f3640', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          {loggedInUser ? `Go to My Profile (${loggedInUser.name}) 👤` : "Login / Sign Up 🛒"}
        </button>
      </main>
      
      <Footer />

      {cart.length > 0 && (
        <div onClick={() => window.location.hash = "#cart"} style={{ position: 'fixed', bottom: '15px', left: '15px', right: '15px', backgroundColor: '#10b981', color: 'white', padding: '15px 20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', boxShadow: '0 10px 20px rgba(16, 185, 129, 0.4)', zIndex: 1000 }}>
          <div style={{ fontWeight: 'bold' }}>{cartTotalItems} ITEM{cartTotalItems > 1 ? 'S' : ''} | ₹{cartTotalPrice}</div>
          <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>View Cart 🛒 <span style={{ fontSize: '1.2rem' }}>➡️</span></div>
        </div>
      )}
    </div>
  );
}

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

import ProductFeed from './ProductFeed.jsx';
import Cart from './Cart.jsx';

export default function App() {
  const [currentView, setCurrentView] = useState("customer");
  
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  
  // 🏪 This state now stores the WHOLE Shop object once logged in
  const [isShopAuthenticated, setIsShopAuthenticated] = useState(null);
  
  const [loggedInUser, setLoggedInUser] = useState(() => {
    const saved = localStorage.getItem("packitout_user");
    return saved ? JSON.parse(saved) : null;
  });

  const [cart, setCart] = useState([]);

  // 🛒 Cart Security Check
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

  // 🧭 URL Hash Routing
  useEffect(() => {
    const checkUrl = () => {
      if (window.location.hash === "#admin") setCurrentView("admin");
      else if (window.location.hash === "#shop") setCurrentView("shop");
      else if (window.location.hash === "#account") setCurrentView("account");
      else if (window.location.hash === "#cart") setCurrentView("cart");
      else setCurrentView("customer");
    };
    checkUrl();
    window.addEventListener("hashchange", checkUrl);
    return () => window.removeEventListener("hashchange", checkUrl);
  }, []);

  const handleUserLogin = (userData) => {
    localStorage.setItem("packitout_user", JSON.stringify(userData));
    setLoggedInUser(userData);
  };

  const handleUserLogout = () => {
    localStorage.removeItem("packitout_user");
    setLoggedInUser(null);
    setCart([]);
    window.location.hash = "";
  };

  // --- VIEW RENDERING LOGIC ---

  // 1. ADMIN VIEW
  if (currentView === "admin") {
    if (!isAdminAuthenticated) return <AdminLogin onLogin={() => setIsAdminAuthenticated(true)} />;
    return <AdminDashboard onExit={() => { setIsAdminAuthenticated(false); window.location.hash = ""; }} />;
  }

  // 2. SHOP VIEW (Corrected Data Handoff)
  if (currentView === "shop") {
    if (!isShopAuthenticated) {
      return <ShopLogin onLogin={(shopData) => setIsShopAuthenticated(shopData)} />;
    }
    return (
      <ShopDashboard 
        user={isShopAuthenticated} 
        onExit={() => { setIsShopAuthenticated(null); window.location.hash = ""; }} 
      />
    );
  }

  // 3. USER ACCOUNT VIEW
  if (currentView === "account") {
    if (!loggedInUser) return <UserAuth onLoginSuccess={handleUserLogin} />;
    return <UserDashboard user={loggedInUser} onExit={() => window.location.hash = ""} onLogout={handleUserLogout} />;
  }

  // 4. CART VIEW
  if (currentView === "cart") {
    return (
      <Cart 
        cart={cart} 
        user={loggedInUser} 
        onBack={() => window.location.hash = ""} 
        onCheckoutSuccess={() => {
          setCart([]);
          window.location.hash = "#account";
        }}
      />
    );
  }

  // 5. CUSTOMER HOME VIEW
  const cartTotalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const cartTotalPrice = cart.reduce((sum, item) => sum + (item.mrp * item.qty), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', fontFamily: 'sans-serif', backgroundColor: '#f4f7f6', paddingBottom: cart.length > 0 ? '80px' : '0' }}>
      <Header />
      <Categories />
      
      <main style={{ flex: 1, padding: '1rem 0 3rem 0', textAlign: 'center' }}>
        <ProductFeed onAddToCart={handleAddToCart} />
        <button 
          onClick={() => window.location.hash = "#account"} 
          style={{ marginTop: '30px', padding: '12px 24px', backgroundColor: '#2f3640', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
        >
          {loggedInUser ? `Go to My Profile (${loggedInUser.name}) 👤` : "Login / Sign Up 🛒"}
        </button>
      </main>
      
      <Footer />

      {/* Floating Cart Bar */}
      {cart.length > 0 && (
        <div 
          onClick={() => window.location.hash = "#cart"}
          style={{ position: 'fixed', bottom: '15px', left: '15px', right: '15px', backgroundColor: '#10b981', color: 'white', padding: '15px 20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', boxShadow: '0 10px 20px rgba(16, 185, 129, 0.4)', zIndex: 1000 }}
        >
          <div style={{ fontWeight: 'bold' }}>
            {cartTotalItems} ITEM{cartTotalItems > 1 ? 'S' : ''} | ₹{cartTotalPrice}
          </div>
          <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            View Cart 🛒 <span style={{ fontSize: '1.2rem' }}>➡️</span>
          </div>
        </div>
      )}
    </div>
  );
}

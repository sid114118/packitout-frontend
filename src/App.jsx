import React, { useState, useEffect } from 'react';
import Header from './Header.jsx';
import Categories from './Categories.jsx';
import Footer from './Footer.jsx';

// 👑 Dashboards & Auth
import AdminDashboard from './AdminDashboard.jsx';
import AdminLogin from './AdminLogin.jsx';
import ShopDashboard from './ShopDashboard.jsx';
import ShopLogin from './ShopLogin.jsx';
import UserDashboard from './UserDashboard.jsx';
import UserAuth from './UserAuth.jsx';

// 🛒 Shopping Feed & Cart
import ProductFeed from './ProductFeed.jsx';
import Cart from './Cart.jsx'; // 👈 NEW IMPORT!

export default function App() {
  const [currentView, setCurrentView] = useState("customer");
  
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isShopAuthenticated, setIsShopAuthenticated] = useState(false);
  
  const [loggedInUser, setLoggedInUser] = useState(() => {
    const saved = localStorage.getItem("packitout_user");
    return saved ? JSON.parse(saved) : null;
  });

  // 🛒 NEW: CART STATE MEMORY
  const [cart, setCart] = useState([]);

  // ➕ Function to add items to cart
  const handleAddToCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(item => item._id === product._id);
      if (existingItem) {
        // If it's already in the cart, just increase the quantity by 1
        return prevCart.map(item => item._id === product._id ? { ...item, qty: item.qty + 1 } : item);
      } else {
        // If it's new, add it with a quantity of 1
        return [...prevCart, { ...product, qty: 1 }];
      }
    });
  };

  useEffect(() => {
    const checkUrl = () => {
      if (window.location.hash === "#admin") setCurrentView("admin");
      else if (window.location.hash === "#shop") setCurrentView("shop");
      else if (window.location.hash === "#account") setCurrentView("account");
      else if (window.location.hash === "#cart") setCurrentView("cart"); // 👈 NEW CART ROUTE
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
    window.location.hash = "";
  };

  // 🔴 ROUTES
  if (currentView === "admin" && !isAdminAuthenticated) return <AdminLogin onLogin={() => setIsAdminAuthenticated(true)} />;
  if (currentView === "admin" && isAdminAuthenticated) return <AdminDashboard onExit={() => { setIsAdminAuthenticated(false); window.location.hash = ""; }} />;

  if (currentView === "shop" && !isShopAuthenticated) return <ShopLogin onLogin={() => setIsShopAuthenticated(true)} />;
  if (currentView === "shop" && isShopAuthenticated) return <ShopDashboard onExit={() => { setIsShopAuthenticated(false); window.location.hash = ""; }} />;

  if (currentView === "account") {
    if (!loggedInUser) return <UserAuth onLoginSuccess={handleUserLogin} />;
    return <UserDashboard user={loggedInUser} onExit={() => window.location.hash = ""} onLogout={handleUserLogout} />;
  }

  // 🛒 NEW: SHOW CART SCREEN
  if (currentView === "cart") {
    return <Cart cart={cart} onBack={() => window.location.hash = ""} />;
  }

  // 🧮 Calculate total items and price for the sticky bottom bar
  const cartTotalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const cartTotalPrice = cart.reduce((sum, item) => sum + (item.mrp * item.qty), 0);

  // 🛍️ NORMAL CUSTOMER APP
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', fontFamily: 'sans-serif', backgroundColor: '#f4f7f6', paddingBottom: cart.length > 0 ? '80px' : '0' }}>
      <Header />
      <Categories />
      
      <main style={{ flex: 1, padding: '1rem 0 3rem 0', textAlign: 'center' }}>
        
        {/* 👇 WE PASS THE ADD TO CART FUNCTION TO THE FEED */}
        <ProductFeed onAddToCart={handleAddToCart} />
        
        <button 
          onClick={() => window.location.hash = "#account"} 
          style={{ marginTop: '30px', padding: '12px 24px', backgroundColor: '#2f3640', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
        >
          {loggedInUser ? `Go to My Profile (${loggedInUser.name}) 👤` : "Login / Sign Up 🛒"}
        </button>
      </main>
      
      <Footer />

      {/* 🟢 STICKY BOTTOM CART BAR (Only shows if items are in cart) */}
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

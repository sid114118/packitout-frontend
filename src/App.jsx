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

// 🛒 Shopping Feed
import ProductFeed from './ProductFeed.jsx';

export default function App() {
  const [currentView, setCurrentView] = useState("customer");
  
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isShopAuthenticated, setIsShopAuthenticated] = useState(false);
  
  // 🧠 SMART MEMORY: Checks if the user logged in previously!
  const [loggedInUser, setLoggedInUser] = useState(() => {
    const saved = localStorage.getItem("packitout_user");
    return saved ? JSON.parse(saved) : null;
  });

  // 🕵️ Listens to the URL
  useEffect(() => {
    const checkUrl = () => {
      if (window.location.hash === "#admin") setCurrentView("admin");
      else if (window.location.hash === "#shop") setCurrentView("shop");
      else if (window.location.hash === "#account") setCurrentView("account");
      else setCurrentView("customer");
    };
    checkUrl();
    window.addEventListener("hashchange", checkUrl);
    return () => window.removeEventListener("hashchange", checkUrl);
  }, []);

  // 💾 Saves user to browser memory when they log in
  const handleUserLogin = (userData) => {
    localStorage.setItem("packitout_user", JSON.stringify(userData));
    setLoggedInUser(userData);
  };

  // 🗑️ Clears memory when they log out
  const handleUserLogout = () => {
    localStorage.removeItem("packitout_user");
    setLoggedInUser(null);
    window.location.hash = "";
  };

  // 🔴 SUPER ADMIN ROUTES
  if (currentView === "admin" && !isAdminAuthenticated) return <AdminLogin onLogin={() => setIsAdminAuthenticated(true)} />;
  if (currentView === "admin" && isAdminAuthenticated) return <AdminDashboard onExit={() => { setIsAdminAuthenticated(false); window.location.hash = ""; }} />;

  // 🏪 SHOP PARTNER ROUTES
  if (currentView === "shop" && !isShopAuthenticated) return <ShopLogin onLogin={() => setIsShopAuthenticated(true)} />;
  if (currentView === "shop" && isShopAuthenticated) return <ShopDashboard onExit={() => { setIsShopAuthenticated(false); window.location.hash = ""; }} />;

  // 👤 CUSTOMER ACCOUNT ROUTE
  if (currentView === "account") {
    if (!loggedInUser) {
      return <UserAuth onLoginSuccess={handleUserLogin} />;
    }
    return <UserDashboard user={loggedInUser} onExit={() => window.location.hash = ""} onLogout={handleUserLogout} />;
  }

  // 🛍️ NORMAL CUSTOMER APP
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', fontFamily: 'sans-serif', backgroundColor: '#f4f7f6' }}>
      <Header />
      <Categories />
      
      <main style={{ flex: 1, padding: '1rem 0 3rem 0', textAlign: 'center' }}>
        
        {/* 🍎 Your live products feed! */}
        <ProductFeed />
        
        <button 
          onClick={() => window.location.hash = "#account"} 
          style={{ marginTop: '30px', padding: '12px 24px', backgroundColor: '#2f3640', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
        >
          {loggedInUser ? `Go to My Profile (${loggedInUser.name}) 👤` : "Login / Sign Up 🛒"}
        </button>
        
      </main>
      
      <Footer />
    </div>
  );
}

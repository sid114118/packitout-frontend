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
      return <UserAuth onLoginSuccess={handleUserLogin} />; // Passes data to memory
    }
    // 👇 Passes REAL data to the Dashboard!
    return <UserDashboard user={loggedInUser} onExit={() => window.location.hash = ""} onLogout={handleUserLogout} />;
  }

  // 🛍️ NORMAL CUSTOMER APP
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', fontFamily: 'sans-serif', backgroundColor: '#f4f7f6' }}>
      <Header />
      <Categories />
      <main style={{ flex: 1, padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ color: '#2c3e50', marginBottom: '1.5rem', fontSize: '1.2rem' }}>Shopping Area</h2>
        <p>Products will load here!</p>
        
        <button 
          onClick={() => window.location.hash = "#account"} 
          style={{ marginTop: '20px', padding: '12px 24px', backgroundColor: '#ff4757', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          {loggedInUser ? `Go to My Profile (${loggedInUser.name}) 👤` : "Login / Sign Up 🛒"}
        </button>
      </main>
      <Footer />
    </div>
  );
}

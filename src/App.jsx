import React, { useState, useEffect } from 'react';
import Header from './Header.jsx';
import Categories from './Categories.jsx';
import Footer from './Footer.jsx';

import AdminDashboard from './AdminDashboard.jsx';
import AdminLogin from './AdminLogin.jsx';
import ShopDashboard from './ShopDashboard.jsx';
import ShopLogin from './ShopLogin.jsx';
import UserDashboard from './UserDashboard.jsx';
import UserAuth from './UserAuth.jsx'; // 👈 Import the new Auth screen!

export default function App() {
  const [currentView, setCurrentView] = useState("customer");
  
  // Auth states
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isShopAuthenticated, setIsShopAuthenticated] = useState(false);
  
  // 👤 Customer Auth State (Holds the actual logged-in user data)
  const [loggedInUser, setLoggedInUser] = useState(null);

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

  // 🔴 SUPER ADMIN ROUTES
  if (currentView === "admin" && !isAdminAuthenticated) return <AdminLogin onLogin={() => setIsAdminAuthenticated(true)} />;
  if (currentView === "admin" && isAdminAuthenticated) return <AdminDashboard onExit={() => { setIsAdminAuthenticated(false); window.location.hash = ""; }} />;

  // 🏪 SHOP PARTNER ROUTES
  if (currentView === "shop" && !isShopAuthenticated) return <ShopLogin onLogin={() => setIsShopAuthenticated(true)} />;
  if (currentView === "shop" && isShopAuthenticated) return <ShopDashboard onExit={() => { setIsShopAuthenticated(false); window.location.hash = ""; }} />;

  // 👤 CUSTOMER ACCOUNT ROUTE (Now protected by UserAuth!)
  if (currentView === "account") {
    if (!loggedInUser) {
      // If not logged in, show the Login/Signup screen
      return <UserAuth onLoginSuccess={(userData) => setLoggedInUser(userData)} />;
    }
    // If logged in, show their dashboard
    return <UserDashboard onExit={() => window.location.hash = ""} />;
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
          {loggedInUser ? "Go to My Profile 👤" : "Login / Sign Up 🛒"}
        </button>
      </main>
      <Footer />
    </div>
  );
}

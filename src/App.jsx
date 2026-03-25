import React, { useState, useEffect } from 'react';
import Header from './Header.jsx';
import Categories from './Categories.jsx'; // This has your banner AND your categories!
import Footer from './Footer.jsx';

import AdminDashboard from './AdminDashboard.jsx';
import AdminLogin from './AdminLogin.jsx';

// 👇 Import your new Shop files!
import ShopDashboard from './ShopDashboard.jsx';
import ShopLogin from './ShopLogin.jsx';

export default function App() {
  const [currentView, setCurrentView] = useState("customer");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 🕵️ Listen to the URL
  useEffect(() => {
    const checkUrl = () => {
      if (window.location.hash === "#admin") {
        setCurrentView("admin");
      } else {
        setCurrentView("customer");
      }
    };
    
    checkUrl();
    window.addEventListener("hashchange", checkUrl);
    return () => window.removeEventListener("hashchange", checkUrl);
  }, []);

  // 🔴 SCENARIO 1: Admin URL, but not logged in
  if (currentView === "admin" && !isAuthenticated) {
    return <AdminLogin onLogin={() => setIsAuthenticated(true)} />;
  }

  // 🟢 SCENARIO 2: Admin URL, AND logged in
  if (currentView === "admin" && isAuthenticated) {
    return <AdminDashboard onExit={() => {
      setIsAuthenticated(false);
      window.location.hash = ""; // Clears the URL to go back to shopping
    }} />;
  }

  // 🛍️ SCENARIO 3: Normal Customer App
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', fontFamily: 'sans-serif', backgroundColor: '#f4f7f6' }}>
      <Header />
      
      {/* Renders the Banner and the Grid together */}
      <Categories /> 

      <main style={{ flex: 1, padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ color: '#2c3e50', marginBottom: '1.5rem', fontSize: '1.2rem' }}>Shopping Area</h2>
        <p>Your products will load here when a category is clicked!</p>
      </main>
      
      <Footer />
    </div>
  );
}

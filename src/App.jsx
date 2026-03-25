import React, { useState, useEffect } from 'react';
import Header from './Header.jsx';
import Categories from './Categories.jsx';
import Footer from './Footer.jsx';
import AdminDashboard from './AdminDashboard.jsx';
import AdminLogin from './AdminLogin.jsx'; // 👈 Import the Login Screen

export default function App() {
  const [currentView, setCurrentView] = useState("customer");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 🕵️ Listen to the URL to see if they are trying to access the admin panel
  useEffect(() => {
    const checkUrl = () => {
      if (window.location.hash === "#admin") {
        setCurrentView("admin");
      } else {
        setCurrentView("customer");
      }
    };
    
    checkUrl(); // Check when the app first opens
    window.addEventListener("hashchange", checkUrl); // Check if they type it mid-session
    return () => window.removeEventListener("hashchange", checkUrl);
  }, []);

  // SCENARIO 1: They went to the admin URL, but haven't logged in yet
  if (currentView === "admin" && !isAuthenticated) {
    return <AdminLogin onLogin={() => setIsAuthenticated(true)} />;
  }

  // SCENARIO 2: They are on the admin URL AND correctly entered the password
  if (currentView === "admin" && isAuthenticated) {
    return <AdminDashboard onExit={() => {
      setIsAuthenticated(false);
      window.location.hash = ""; // Clears the URL and kicks them back to the customer app
    }} />;
  }

  // SCENARIO 3: Normal Customer App (no #admin in the URL)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', fontFamily: 'sans-serif', backgroundColor: '#f4f7f6' }}>
      <Header />
      <HeroBanners />
      <Categories />

      <main style={{ flex: 1, padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ color: '#2c3e50', marginBottom: '1.5rem', fontSize: '1.2rem' }}>Shopping Area</h2>
        <p>Your products will load here when a category is clicked!</p>
      </main>
      
      <Footer />
    </div>
  );
}

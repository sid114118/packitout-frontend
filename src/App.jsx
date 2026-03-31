import React, { useState, useEffect } from 'react';
import Header from './Header.jsx';
import Categories from './Categories.jsx';

import AdminDashboard from './AdminDashboard.jsx';
import AdminLogin from './AdminLogin.jsx';
import ShopDashboard from './ShopDashboard.jsx';
import ShopLogin from './ShopLogin.jsx';
import UserDashboard from './UserDashboard.jsx';
import UserAuth from './UserAuth.jsx';
import ProductFeed from './ProductFeed.jsx';
import Cart from './Cart.jsx';
import OrderSuccess from './OrderSuccess.jsx';
import BottomNav from './BottomNav.jsx';
// 🌟 NEW: Import the Nearby Components
import Nearby from './Nearby.jsx';
import ShopDetail from './ShopDetail.jsx';

export default function App() {
  const [currentView, setCurrentView] = useState("customer");
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isShopAuthenticated, setIsShopAuthenticated] = useState(null);
  
  // 🌟 NEW: State to track which shop is being viewed in detail
  const [viewingShop, setViewingShop] = useState(null);

  const [selectedCategory, setSelectedCategory] = useState(null); 
  const [searchQuery, setSearchQuery] = useState("");
  
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  const [loggedInUser, setLoggedInUser] = useState(() => {
    const saved = localStorage.getItem("packitout_user");
    return saved ? JSON.parse(saved) : null;
  });

  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem("packitout_cart");
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem("packitout_cart", JSON.stringify(cart));
  }, [cart]);

  // Scroll Tracking
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 60) setIsHeaderVisible(false);
      else if (currentScrollY < lastScrollY) setIsHeaderVisible(true);
      setLastScrollY(currentScrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // URL Router
  useEffect(() => {
    const checkUrl = () => {
      if (window.location.hash === "#admin") setCurrentView("admin");
      else if (window.location.hash === "#shop") setCurrentView("shop");
      else if (window.location.hash === "#account") setCurrentView("account");
      else if (window.location.hash === "#cart") setCurrentView("cart");
      else if (window.location.hash === "#success") setCurrentView("success");
      else if (window.location.hash === "#nearby") setCurrentView("nearby");
      else {
        setCurrentView("customer");
        setSelectedCategory(null);
        setSearchQuery(""); 
      }
      // Reset viewing shop when changing main routes
      setViewingShop(null);
    };
    checkUrl();
    window.addEventListener("hashchange", checkUrl);
    return () => window.removeEventListener("hashchange", checkUrl);
  }, []);

  const handleAddToCart = (product) => {
    if (!loggedInUser) {
      alert("Please log in or sign up to add items to your cart! 🛒");
      window.location.hash = "#account";
      return;
    }
    setCart((prevCart) => {
      const existingItem = prevCart.find(item => item._id === product._id);
      if (existingItem) return prevCart.map(item => item._id === product._id ? { ...item, qty: item.qty + 1 } : item);
      return [...prevCart, { ...product, qty: 1 }];
    });
  };

  const handleRemoveFromCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(item => item._id === product._id);
      if (!existingItem) return prevCart;
      if (existingItem.qty > 1) return prevCart.map(item => item._id === product._id ? { ...item, qty: item.qty - 1 } : item);
      return prevCart.filter(item => item._id !== product._id);
    });
  };

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

  // Helper function to update primary shop
  const handleSetPrimaryShop = async (shopId) => {
    try {
      const response = await fetch(`https://darkslategrey-snail-415133.hostingersite.com/users/${loggedInUser._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primaryShop: shopId })
      });
      if (response.ok) {
        const updatedUser = await response.json();
        setLoggedInUser(updatedUser);
        localStorage.setItem("packitout_user", JSON.stringify(updatedUser));
        alert("Success! This is now your primary shop. 🏪");
        window.location.hash = ""; // Redirect home to see new menu
      }
    } catch (err) {
      alert("Failed to update primary shop.");
    }
  };

  const renderContent = () => {
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

    if (currentView === "success") return <OrderSuccess />;

    if (currentView === "cart") {
      return <Cart cart={cart} setCart={setCart} user={loggedInUser} onBack={() => window.location.hash = ""} onCheckoutSuccess={() => { setCart([]); window.location.hash = "#success"; }} />;
    }

    // 🌟 UPDATED: Nearby Route with Grid and Detail logic
    if (currentView === "nearby") {
      if (viewingShop) {
        return <ShopDetail shop={viewingShop} onBack={() => setViewingShop(null)} onSetPrimary={handleSetPrimaryShop} />;
      }
      return (
        <div style={{ paddingBottom: '80px' }}>
          <Header user={loggedInUser} />
          <Nearby user={loggedInUser} onSelectShop={(shop) => setViewingShop(shop)} />
        </div>
      );
    }

    // Default Customer Feed
    const cartTotalItems = cart.reduce((sum, item) => sum + item.qty, 0);
    const cartTotalPrice = cart.reduce((sum, item) => sum + ((item.sellingPrice || item.mrp) * item.qty), 0);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', fontFamily: 'sans-serif', backgroundColor: '#f3f4f6', paddingBottom: cart.length > 0 ? '140px' : '70px' }}>
        <div style={{ position: 'sticky', top: isHeaderVisible ? '0px' : '-65px', zIndex: 1001, transition: 'top 0.3s ease-in-out', backgroundColor: '#f3f4f6' }}>
          <Header user={loggedInUser} />
          <div style={{ padding: '10px 15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: '12px', padding: '10px 15px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
              <input type="text" placeholder='Search "Maggi", "Milk", "Chips"...' value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ border: 'none', outline: 'none', width: '100%', fontSize: '1rem', color: '#0f172a', backgroundColor: 'transparent' }} />
              {searchQuery && <button onClick={() => setSearchQuery("")} style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: '#94a3b8', cursor: 'pointer' }}>✖</button>}
            </div>
          </div>
        </div>

        {!selectedCategory && !searchQuery && <Categories onCategorySelect={setSelectedCategory} />}
        
        <main style={{ flex: 1, padding: '1rem 0 3rem 0', textAlign: 'center' }}>
          <ProductFeed user={loggedInUser} cart={cart} onAddToCart={handleAddToCart} onRemoveFromCart={handleRemoveFromCart} onViewCart={() => window.location.hash = "#cart"} selectedCategory={selectedCategory} onClearCategory={() => setSelectedCategory(null)} searchQuery={searchQuery} />
        </main>
        
        {cart.length > 0 && (
          <div onClick={() => window.location.hash = "#cart"} style={{ position: 'fixed', bottom: '80px', left: '12px', right: '12px', zIndex: 1000, backgroundColor: '#0c831f', color: '#fff', padding: '10px 14px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', boxShadow: '0 4px 20px rgba(12, 131, 31, 0.3)', animation: 'fadeIn 0.2s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', width: '38px', height: '38px', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.2rem' }}>🛒</div>
              <div style={{ textAlign: 'left', lineHeight: '1.3' }}>
                <div style={{ fontWeight: '600', fontSize: '0.75rem', opacity: 0.95 }}>{cartTotalItems} item{cartTotalItems > 1 ? 's' : ''}</div>
                <div style={{ fontWeight: '800', fontSize: '1rem' }}>₹ {cartTotalPrice.toFixed(2)}</div>
              </div>
            </div>
            <div style={{ fontWeight: '800', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              View Cart <span style={{ fontSize: '1.2rem' }}>▶</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const showBottomNav = ["customer", "nearby", "account", "cart", "success"].includes(currentView);

  return (
    <>
      {renderContent()}
      {showBottomNav && <BottomNav currentView={currentView} />}
    </>
  );
}

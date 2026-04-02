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
import Nearby from './Nearby.jsx';
import ShopDetail from './ShopDetail.jsx';

// 🚨 MOBILE DEBUGGER: Shows exactly what broke on your phone screen
class CrashCatcher extends React.Component {
  constructor(props) {
    super(props);
    this.state = { err: null, info: null };
  }
  componentDidCatch(error, info) {
    this.setState({ err: error.toString(), info: info.componentStack });
  }
  render() {
    if (this.state.err) {
      return (
        <div style={{ padding: '60px 20px', background: '#991b1b', color: 'white', minHeight: '100vh', textAlign: 'left', fontFamily: 'monospace' }}>
          <h2 style={{ margin: '0 0 10px 0' }}>🚨 APP CRASHED</h2>
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px' }}>
             <p style={{ fontWeight: 'bold' }}>Error: {this.state.err}</p>
          </div>
          <button 
            onClick={() => { localStorage.removeItem("packitout_cart"); window.location.reload(); }} 
            style={{ marginTop: '20px', padding: '15px', width: '100%', background: '#ef4444', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold' }}
          >
            🗑️ Clear Broken Cart & Restart
          </button>
          <button 
            onClick={() => window.location.reload()} 
            style={{ marginTop: '10px', padding: '15px', width: '100%', background: 'white', color: '#991b1b', border: 'none', borderRadius: '10px', fontWeight: 'bold' }}
          >
            🔄 Simple Refresh
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [currentView, setCurrentView] = useState("customer");
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isShopAuthenticated, setIsShopAuthenticated] = useState(null);
  const [viewingShop, setViewingShop] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null); 
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  // 🛡️ SAFE STORAGE LOADING
  const [loggedInUser, setLoggedInUser] = useState(() => {
    try {
      const saved = localStorage.getItem("packitout_user");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem("packitout_cart");
      const parsed = savedCart ? JSON.parse(savedCart) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem("packitout_cart", JSON.stringify(cart));
  }, [cart]);

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
        setIsSearchOpen(false);
      }
      setViewingShop(null);
    };
    checkUrl();
    window.addEventListener("hashchange", checkUrl);
    return () => window.removeEventListener("hashchange", checkUrl);
  }, []);

  // 🛡️ Safe Add to Cart (Fixed for potential NaN)
  const handleAddToCart = (product) => {
    if (!loggedInUser) {
      alert("Please log in first! 🛒");
      window.location.hash = "#account";
      return;
    }
    if (!product || !product._id) {
       alert("Data Error: Product has no ID");
       return;
    }

    setCart((prevCart) => {
      const existingItem = prevCart.find(item => item._id === product._id);
      
      // Force prices to be numbers to prevent math crashes
      const safePrice = Number(product.sellingPrice || product.mrp || 0);

      if (existingItem) {
        return prevCart.map(item => 
          item._id === product._id ? { ...item, qty: (item.qty || 1) + 1 } : item
        );
      }
      return [...prevCart, { ...product, qty: 1, sellingPrice: safePrice }];
    });
  };

  const handleRemoveFromCart = (product) => {
    if (!product || !product._id) return;
    setCart((prevCart) => {
      const existingItem = prevCart.find(item => item._id === product._id);
      if (!existingItem) return prevCart;
      if (existingItem.qty > 1) {
        return prevCart.map(item => item._id === product._id ? { ...item, qty: item.qty - 1 } : item);
      }
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
        alert("Success! Shop updated. 🏪");
        window.location.hash = "";
      }
    } catch (err) { alert("Failed to update shop."); }
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
      return (
        <CrashCatcher>
          <Cart cart={cart} setCart={setCart} user={loggedInUser} onBack={() => window.location.hash = ""} onCheckoutSuccess={() => { setCart([]); window.location.hash = "#success"; }} />
        </CrashCatcher>
      );
    }

    if (currentView === "nearby") {
      if (viewingShop) return <ShopDetail shop={viewingShop} onBack={() => setViewingShop(null)} onSetPrimary={handleSetPrimaryShop} />;
      return (
        <div style={{ paddingBottom: '80px' }}>
          <Header user={loggedInUser} />
          <Nearby user={loggedInUser} onSelectShop={(shop) => setViewingShop(shop)} />
        </div>
      );
    }

    // 🛡️ Bulletproof Math: Ensures no NaN value ever reaches the UI
    const cartTotalItems = cart.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
    const cartTotalPrice = cart.reduce((sum, item) => {
      const price = Number(item.sellingPrice || item.mrp || 0);
      const qty = Number(item.qty || 0);
      return sum + (price * qty);
    }, 0);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f3f4f6', paddingBottom: cart.length > 0 ? '140px' : '70px' }}>
        <div style={{ position: 'sticky', top: isHeaderVisible ? '0px' : '-65px', zIndex: 1001, transition: 'top 0.3s ease-in-out' }}>
          <Header user={loggedInUser} />
          <div style={{ padding: '10px 15px', backgroundColor: '#f3f4f6' }}>
            <div onClick={() => setIsSearchOpen(true)} style={{ display: 'flex', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: '12px', padding: '10px 15px', border: '1px solid #e2e8f0' }}>
              <span style={{ color: '#94a3b8' }}>Search items...</span>
            </div>
          </div>
        </div>

        {!selectedCategory && !isSearchOpen && <Categories onCategorySelect={setSelectedCategory} />}
        
        <main style={{ flex: 1, padding: '1rem 0' }}>
          <CrashCatcher>
            <ProductFeed 
              user={loggedInUser} cart={cart} 
              onAddToCart={handleAddToCart} onRemoveFromCart={handleRemoveFromCart} 
              onViewCart={() => window.location.hash = "#cart"} 
              selectedCategory={selectedCategory} onClearCategory={() => setSelectedCategory(null)} 
              isSearchOpen={isSearchOpen} onOpenSearch={() => setIsSearchOpen(true)} onCloseSearch={() => setIsSearchOpen(false)}
            />
          </CrashCatcher>
        </main>
        
        {cart.length > 0 && (
          <div onClick={() => window.location.hash = "#cart"} style={{ position: 'fixed', bottom: '80px', left: '12px', right: '12px', zIndex: 1000, backgroundColor: '#0c831f', color: '#fff', padding: '12px 16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 8px 24px rgba(12, 131, 31, 0.4)' }}>
            <div>
              <div style={{ fontWeight: '600', fontSize: '0.75rem' }}>{cartTotalItems} items</div>
              <div style={{ fontWeight: '800', fontSize: '1.1rem' }}>₹{cartTotalPrice.toFixed(2)}</div>
            </div>
            <div style={{ fontWeight: '800' }}>View Cart ▶</div>
          </div>
        )}
      </div>
    );
  };

  const showBottomNav = ["customer", "nearby", "account", "cart", "success"].includes(currentView);

  return (
    <CrashCatcher>
      {renderContent()}
      {showBottomNav && <BottomNav currentView={currentView} />}
    </CrashCatcher>
  );
}

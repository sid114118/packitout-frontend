import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useToast } from './ui/DialogProvider.jsx';

// Eagerly imported: rendered on the customer's first paint.
import Header from './Header.jsx';
import Categories from './Categories.jsx';
import ProductFeed from './ProductFeed.jsx';
import BottomNav from './BottomNav.jsx';

// Lazy: only fetched when the user navigates into them. Keeps the customer's
// initial bundle from carrying admin/shop/account/cart/nearby code.
const AdminDashboard = lazy(() => import('./AdminDashboard.jsx'));
const AdminLogin = lazy(() => import('./AdminLogin.jsx'));
const ShopDashboard = lazy(() => import('./ShopDashboard.jsx'));
const ShopLogin = lazy(() => import('./ShopLogin.jsx'));
const UserDashboard = lazy(() => import('./UserDashboard.jsx'));
const OrdersPage = lazy(() => import('./OrdersPage.jsx'));
const UserAuth = lazy(() => import('./UserAuth.jsx'));
const Cart = lazy(() => import('./Cart.jsx'));
const OrderSuccess = lazy(() => import('./OrderSuccess.jsx'));
const Nearby = lazy(() => import('./Nearby.jsx'));
const ShopDetail = lazy(() => import('./ShopDetail.jsx'));

const BASE_URL = (import.meta.env.VITE_API_BASE || "https://darkslategrey-snail-415133.hostingersite.com");

// Module-level so repeated calls (login/logout) don't kick off duplicate fetches.
let onesignalPromise;
const loadOneSignal = () => {
  if (!onesignalPromise) {
    onesignalPromise = import('react-onesignal').then(m => m.default);
  }
  return onesignalPromise;
};

const RouteFallback = () => (
  <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px', color: '#64748b', fontSize: '0.9rem', fontWeight: 600 }}>
    <div className="pio-spinner" aria-hidden="true" />
    <span>Loading…</span>
  </div>
);

class CrashCatcher extends React.Component {
  constructor(props) { super(props); this.state = { err: null, info: null }; }
  componentDidCatch(error, info) { this.setState({ err: error.toString(), info: info.componentStack }); }
  render() {
    if (this.state.err) {
      return (
        <div style={{ padding: '40px 20px', minHeight: '100vh', background: '#f4f6f8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: '420px', background: '#fff', borderRadius: '20px', padding: '28px 22px', boxShadow: '0 10px 25px rgba(15,23,42,0.08)', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', margin: '0 auto 18px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 style={{ margin: '0 0 8px', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>Something went wrong</h2>
            <p style={{ margin: '0 0 20px', fontSize: '0.9rem', color: '#64748b', lineHeight: 1.5 }}>
              We hit an unexpected error. You can try again — your info is safe.
            </p>
            <details style={{ textAlign: 'left', marginBottom: '20px', fontSize: '0.75rem', color: '#94a3b8' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Show details</summary>
              <pre style={{ marginTop: '8px', padding: '10px', background: '#f8fafc', borderRadius: '8px', overflowX: 'auto', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>{this.state.err}</pre>
            </details>
            <button
              onClick={() => window.location.reload()}
              className="pio-press"
              style={{ width: '100%', padding: '14px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 8px 22px rgba(22, 163, 74, 0.28)' }}
            >
              Reload app
            </button>
            <button
              onClick={() => { localStorage.removeItem("packitout_cart"); window.location.reload(); }}
              className="pio-press"
              style={{ marginTop: '10px', width: '100%', padding: '14px', background: '#fff', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: '12px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}
            >
              Clear cart and reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const toast = useToast();
  const [currentView, setCurrentView] = useState("customer");
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isShopAuthenticated, setIsShopAuthenticated] = useState(null);
  const [viewingShop, setViewingShop] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null); 
  
  // 🏷️ NEW: Brand State
  const [selectedBrand, setSelectedBrand] = useState(null); 

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  
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
      return Array.isArray(parsed) ? parsed.filter(i => i !== null) : [];
    } catch { return []; }
  });

  // OneSignal SDK is ~200KB and was blocking first paint. Defer it to idle so
  // the feed renders first; the push permission prompt then slides in.
  useEffect(() => {
    const runOneSignal = async () => {
      try {
        const OneSignal = await loadOneSignal();
        await OneSignal.init({
          appId: "1da2e78d-0874-4965-a895-42c9237ee92b",
          allowLocalhostAsSecureOrigin: true,
        });
        OneSignal.Slidedown.promptPush();
      } catch (error) {
        console.error("OneSignal Initialization Error:", error);
      }
    };

    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(runOneSignal, { timeout: 4000 });
      return () => window.cancelIdleCallback?.(id);
    }
    const id = setTimeout(runOneSignal, 2500);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("packitout_cart", JSON.stringify(cart));
    } catch (e) {
      console.error("Cart Save Error", e);
    }
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
      else if (window.location.hash === "#orders") setCurrentView("orders");
      else if (window.location.hash === "#cart") setCurrentView("cart");
      else if (window.location.hash === "#success") setCurrentView("success");
      else if (window.location.hash === "#nearby") setCurrentView("nearby");
      else {
        setCurrentView("customer");
        setSelectedCategory(null);
        setSelectedBrand(null); // 🛡️ Clears brand view on navigation change
        setIsSearchOpen(false);
      }
      setViewingShop(null);
    };
    checkUrl();
    window.addEventListener("hashchange", checkUrl);
    return () => window.removeEventListener("hashchange", checkUrl);
  }, []);

  const handleAddToCart = (product) => {
    if (!loggedInUser) {
      toast("Please log in first! 🛒", 'info');
      window.location.hash = "#account";
      return;
    }
    if (!product || !product._id) return;

    const lightProduct = {
      _id: product._id,
      name: product.name,
      brand: product.brand,
      image: product.image,
      emoji: product.emoji,
      qnty: product.qnty,
      mrp: Number(product.mrp || 0),
      sellingPrice: Number(product.sellingPrice || product.mrp || 0)
    };

    setCart((prevCart) => {
      const cleanCart = prevCart.filter(item => item !== null);
      const existingItem = cleanCart.find(item => item._id === lightProduct._id);
      
      if (existingItem) {
        return cleanCart.map(item =>
          item._id === lightProduct._id
            ? { ...item, qty: (Number(item.qty) || 0) + 1 }
            : item
        );
      }
      return [...cleanCart, { ...lightProduct, qty: 1 }];
    });
  };

  const handleRemoveFromCart = (product) => {
    if (!product || !product._id) return;
    setCart((prevCart) => {
      const cleanCart = prevCart.filter(item => item !== null);
      const existingItem = cleanCart.find(item => item._id === product._id);
      if (!existingItem) return cleanCart;
      if (existingItem.qty > 1) {
        return cleanCart.map(item => item._id === product._id ? { ...item, qty: item.qty - 1 } : item);
      }
      return cleanCart.filter(item => item._id !== product._id);
    });
  };

  const handleUserLogin = (userData) => {
    localStorage.setItem("packitout_user", JSON.stringify(userData));
    setLoggedInUser(userData);
    
    loadOneSignal()
      .then(OneSignal => OneSignal.login(userData._id.toString()))
      .catch(err => console.log("OneSignal Login Error", err));

    window.location.hash = "";
  };

  const handleUserUpdate = (updatedUser, { clearCart = false } = {}) => {
    if (!updatedUser) return;
    localStorage.setItem("packitout_user", JSON.stringify(updatedUser));
    setLoggedInUser(updatedUser);
    if (clearCart) {
      setCart([]);
      // Shop changed → category/brand filters from the previous shop's catalog
      // no longer make sense. Drop them so the user lands on the new shop's home.
      setSelectedCategory(null);
      setSelectedBrand(null);
    }
  };

  // Rehydrate the logged-in user from the server on mount, on tab focus, and
  // when the user opens the account page. Without this, server-side changes
  // like admin coin updates never reach the cached localStorage copy and the
  // UI shows a stale balance until the next login.
  useEffect(() => {
    const userId = loggedInUser?._id;
    if (!userId) return;

    let cancelled = false;
    const refresh = async () => {
      try {
        const res = await fetch(`${BASE_URL}/users/${userId}`);
        if (!res.ok) return;
        const fresh = await res.json();
        if (cancelled || !fresh || !fresh._id) return;
        localStorage.setItem("packitout_user", JSON.stringify(fresh));
        setLoggedInUser(fresh);
      } catch { /* offline / transient — keep cached copy */ }
    };

    refresh();

    const onFocus = () => refresh();
    const onVisibility = () => { if (document.visibilityState === 'visible') refresh(); };
    const onHashChange = () => { if (window.location.hash === '#account') refresh(); };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('hashchange', onHashChange);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('hashchange', onHashChange);
    };
  }, [loggedInUser?._id]);

  const handleUserLogout = () => {
    localStorage.removeItem("packitout_user");
    setLoggedInUser(null);
    setCart([]); 

    loadOneSignal()
      .then(OneSignal => OneSignal.logout())
      .catch(err => console.log("OneSignal Logout Error", err));

    window.location.hash = "";
  };

  const handleSetPrimaryShop = async (shopId) => {
    try {
      const response = await fetch(`${BASE_URL}/users/${loggedInUser._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primaryShop: shopId })
      });
      if (response.ok) {
        const updatedUser = await response.json();
        setLoggedInUser(updatedUser);
        localStorage.setItem("packitout_user", JSON.stringify(updatedUser));
        toast("Primary shop updated");
        window.location.hash = "";
      }
    } catch (err) { toast("Failed to update shop.", 'error'); }
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
      return <UserDashboard user={loggedInUser} onExit={() => window.location.hash = ""} onLogout={handleUserLogout} onUserUpdate={handleUserUpdate} />;
    }
    if (currentView === "orders") {
      if (!loggedInUser) return <UserAuth onLoginSuccess={handleUserLogin} />;
      return <OrdersPage user={loggedInUser} onExit={() => window.location.hash = ""} onAddToCart={handleAddToCart} />;
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
          <Header user={loggedInUser} onUserUpdate={handleUserUpdate} />
          <Nearby user={loggedInUser} onSelectShop={(shop) => setViewingShop(shop)} />
        </div>
      );
    }

    const cartTotalItems = cart.reduce((sum, item) => {
      if (!item) return sum;
      return sum + (Number(item.qty) || 0);
    }, 0);
    
    const cartTotalPrice = cart.reduce((sum, item) => {
      if (!item) return sum;
      const price = Number(item.sellingPrice || item.mrp || 0);
      const qty = Number(item.qty || 0);
      return sum + (price * qty);
    }, 0);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f3f4f6', paddingBottom: cart.length > 0 ? 'calc(150px + env(safe-area-inset-bottom, 0px))' : 'calc(76px + env(safe-area-inset-bottom, 0px))' }}>
        <div style={{ position: 'sticky', top: isHeaderVisible ? '0px' : '-65px', zIndex: 1001, transition: 'top 0.3s ease-in-out' }}>
          <Header user={loggedInUser} onUserUpdate={handleUserUpdate} />
          <div style={{ padding: '10px 15px', backgroundColor: '#f3f4f6' }}>
            <div
              onClick={() => setIsSearchOpen(true)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsSearchOpen(true); }}
              className="pio-press"
              style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#ffffff', borderRadius: '14px', padding: '12px 14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(15,23,42,0.04)', cursor: 'pointer' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span style={{ color: '#94a3b8', fontSize: '0.95rem', fontWeight: 500 }}>Search for atta, milk, soap…</span>
            </div>
          </div>
        </div>

        {/* 🛡️ Hides Categories if viewing a Brand */}
        {!selectedCategory && !selectedBrand && !isSearchOpen && <Categories onCategorySelect={setSelectedCategory} onAddToCart={handleAddToCart} />}
        
        <main style={{ flex: 1, padding: '1rem 0' }}>
          <CrashCatcher>
            <ProductFeed
              user={loggedInUser}
              onUserUpdate={handleUserUpdate}
              cart={cart}
              onAddToCart={handleAddToCart}
              onRemoveFromCart={handleRemoveFromCart}
              onViewCart={() => window.location.hash = "#cart"}
              selectedCategory={selectedCategory} 
              onClearCategory={() => setSelectedCategory(null)} 
              // 🏷️ PASS BRAND STATE DOWN
              selectedBrand={selectedBrand}
              onBrandSelect={setSelectedBrand}
              onClearBrand={() => setSelectedBrand(null)}
              isSearchOpen={isSearchOpen} 
              onOpenSearch={() => setIsSearchOpen(true)} 
              onCloseSearch={() => setIsSearchOpen(false)}
            />
          </CrashCatcher>
        </main>
        
        {cart.length > 0 && (
          <div
            onClick={() => window.location.hash = "#cart"}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') window.location.hash = "#cart"; }}
            className="pio-press"
            style={{
              position: 'fixed',
              bottom: 'calc(76px + env(safe-area-inset-bottom, 0px))',
              left: '12px',
              right: '12px',
              maxWidth: '600px',
              margin: '0 auto',
              zIndex: 1000,
              background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
              color: '#fff',
              padding: '12px 16px',
              borderRadius: '14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 12px 28px rgba(22, 163, 74, 0.38)',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5.5 8h13l-1 12.2a1.5 1.5 0 0 1-1.5 1.3H8a1.5 1.5 0 0 1-1.5-1.3L5.5 8z" />
                  <path d="M8.5 8V6a3.5 3.5 0 0 1 7 0v2" />
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.72rem', opacity: 0.92 }}>{cartTotalItems} item{cartTotalItems !== 1 ? 's' : ''}</div>
                <div style={{ fontWeight: 800, fontSize: '1.08rem', letterSpacing: '-0.2px' }}>₹{cartTotalPrice.toFixed(2)}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '0.95rem' }}>
              <span>View Cart</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </div>
        )}
      </div>
    );
  };

  const showBottomNav = ["customer", "Customer", "nearby", "account", "orders", "cart", "success"].includes(currentView);

  // Total item count for the Cart tab badge — sum of qty across all cart items.
  const navCartCount = cart.reduce((sum, item) => {
    if (!item) return sum;
    return sum + (Number(item.qty) || 0);
  }, 0);

  return (
    <CrashCatcher>
      <Suspense fallback={<RouteFallback />}>
        {renderContent()}
      </Suspense>
      {showBottomNav && <BottomNav currentView={currentView} cartCount={navCartCount} />}
    </CrashCatcher>
  );
               }
      

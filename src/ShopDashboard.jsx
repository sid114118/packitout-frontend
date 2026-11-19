import React, { useState, useEffect } from 'react';
import { useToast } from './ui/DialogProvider.jsx';

// 🔗 IMPORTING YOUR WORKERS!
import OrdersTab from './components/ShopDashboard/OrdersTab';
import ParchiTab from './components/ShopDashboard/ParchiTab';
import InventoryTab from './components/ShopDashboard/InventoryTab';
import NotificationBell from './NotificationBell';
// 🌟 IMPORT THE NEW REVIEWS COMPONENT
import ShopReviews from './components/ShopDashboard/ShopReviews';
import ComplaintsTab from './components/ShopDashboard/ComplaintsTab';
import ShopPhotoModal from './components/ShopDashboard/ShopPhotoModal';
import ShopProfileModal from './components/ShopDashboard/ShopProfileModal';
import ShopLocationBanner from './components/ShopDashboard/ShopLocationBanner';
import RequestsTab from './components/ShopDashboard/RequestsTab.jsx';
import CombosTab from './components/ShopDashboard/CombosTab.jsx';
import CounterPosTab from './components/ShopDashboard/CounterPosTab.jsx';
import KhataTab from './components/ShopDashboard/KhataTab.jsx';
import { cdnImage } from './utils/cloudinaryUrl.js';
import { shopFetch, BASE_URL } from './utils/api.js';
import { playArrivalBell } from './utils/orderAlarm.js';

// ⚡ PERFORMANCE: Cache only lightweight item fields in sessionStorage (<50KB)
// instead of serializing 6+ MB of full MongoDB BSON documents which blocks the main thread.
const cacheSlimInventory = (shopId, inventory) => {
  if (!shopId || !Array.isArray(inventory) || inventory.length === 0) return;
  try {
    const slim = inventory.slice(0, 250).map(item => ({
      product: {
        _id: item?.product?._id || item?.product,
        name: item?.product?.name,
        mrp: item?.product?.mrp,
        image: item?.product?.image,
        category: item?.product?.category,
      },
      sellingPrice: item?.sellingPrice,
      inStock: item?.inStock,
      isFeatured: item?.isFeatured,
      featuredRank: item?.featuredRank,
    }));
    sessionStorage.setItem(`shop_inventory_${shopId}`, JSON.stringify(slim));
  } catch {}
};

export default function ShopDashboard({ user, onExit }) {
  const toast = useToast();
  // --- STATE WITH INSTANT CACHE (0ms First Paint) ---
  const [activeTab, setActiveTab] = useState("orders");
  const [orders, setOrders] = useState(() => {
    try {
      const cached = sessionStorage.getItem(`shop_orders_${user?._id}`);
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [masterCatalog, setMasterCatalog] = useState(() => {
    try {
      const cached = sessionStorage.getItem(`shop_master_catalog`);
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [isCatalogLoading, setIsCatalogLoading] = useState(() => {
    try {
      const cached = sessionStorage.getItem(`shop_master_catalog`);
      return !cached || JSON.parse(cached).length === 0;
    } catch { return true; }
  });
  const [catalogError, setCatalogError] = useState(null);
  const [isInventoryLoading, setIsInventoryLoading] = useState(() => {
    const inv = user?.inventory;
    if (Array.isArray(inv) && inv.some(i => i && i.product && typeof i.product === 'object' && i.product._id)) {
      return false;
    }
    try {
      const cached = sessionStorage.getItem(`shop_inventory_${user?._id}`);
      return !cached;
    } catch { return true; }
  });
  const [shopData, setShopData] = useState(() => {
    let initial = user;
    try {
      const cached = sessionStorage.getItem(`shop_inventory_${user?._id}`);
      if (cached) {
        const parsedInv = JSON.parse(cached);
        if (Array.isArray(parsedInv) && parsedInv.length > 0) {
          initial = { ...user, inventory: parsedInv };
        }
      }
    } catch {}
    return initial;
  });

  // Safely merge updated shop payloads while always preserving the sessionToken
  // and the populated inventory in memory. The server now returns slim docs for
  // most PATCH endpoints (no inventory populate) so we keep prev.inventory
  // unless the update explicitly includes one.
  const updateShopDataSafe = (updated) => {
    if (!updated) return;
    setShopData(prev => ({
      ...prev,
      ...updated,
      // Keep existing populated inventory if the new payload doesn't include one
      inventory: (updated.inventory && updated.inventory.length > 0) ? updated.inventory : (prev?.inventory ?? []),
      sessionToken: updated.sessionToken || prev?.sessionToken || user?.sessionToken,
    }));
  };

  const [parchiRequests, setParchiRequests] = useState([]);
  const [selectedParchi, setSelectedParchi] = useState(null);
  const [parchiBill, setParchiBill] = useState([]);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [khataSummary, setKhataSummary] = useState(null);
  const [khataFocusPhone, setKhataFocusPhone] = useState('');
  const [khataRefreshSignal, setKhataRefreshSignal] = useState(0);

  const fetchKhataSummary = async () => {
    try {
      const res = await shopFetch(shopData, `/shops/${shopData._id}/khata`);
      if (!res.ok) return;
      const data = await res.json();
      if (data?.summary) setKhataSummary(data.summary);
    } catch (err) { console.log(err); }
  };

  // --- DATA FETCHING ---
  useEffect(() => {
    // ⚡ FIX #3 — Load fast/critical data FIRST so orders appear immediately.
    fetchOrders();
    fetchParchis();
    fetchKhataSummary();

    // Setup Server-Sent Events for real-time updates instead of polling
    // Native EventSource doesn't support custom headers, so we pass the token in the query string
    const sseUrl = `${BASE_URL}/shop-events/${shopData._id}?token=${shopData.sessionToken || ''}`;
    const eventSource = new EventSource(sseUrl);
    let khataTimeout;
    eventSource.addEventListener('refresh_khata', () => {
      clearTimeout(khataTimeout);
      khataTimeout = setTimeout(() => {
        fetchKhataSummary();
        fetchOrders();
        setKhataRefreshSignal(s => s + 1);
      }, 400);
    });

    let ordersTimeout;
    let parchisTimeout;

    eventSource.addEventListener('refresh_orders', () => {
      clearTimeout(ordersTimeout);
      ordersTimeout = setTimeout(fetchOrders, 500);
    });
    eventSource.addEventListener('order_chat_update', () => {
      clearTimeout(ordersTimeout);
      ordersTimeout = setTimeout(fetchOrders, 400);
    });
    eventSource.addEventListener('customer_arrived', () => {
      playArrivalBell();
      toast("🚨 Customer has reached the counter!", "info");
      clearTimeout(ordersTimeout);
      ordersTimeout = setTimeout(fetchOrders, 200);
    });
    eventSource.addEventListener('refresh_parchis', () => {
      clearTimeout(parchisTimeout);
      parchisTimeout = setTimeout(fetchParchis, 500);
    });

    eventSource.onerror = (err) => {
      console.error("SSE connection error, browser will auto-reconnect.", err);
    };

    return () => {
      clearTimeout(ordersTimeout);
      clearTimeout(parchisTimeout);
      clearTimeout(khataTimeout);
      eventSource.close();
    };
  }, [shopData._id]);

  // Shop-scoped fetch — was pulling every order on the platform every 10s and
  // filtering client-side, which leaked other shops' orders and got slower as
  // the platform grew. New endpoint enforces ownership server-side.
  // ⚡ LAZY LOAD: Only fetch master catalog & full inventory when user opens Inventory, POS or Combos tabs
  useEffect(() => {
    if (activeTab === "inventory" || activeTab === "pos" || activeTab === "combos") {
      if (masterCatalog.length === 0) fetchMasterCatalog();
      if (!shopData.inventory || shopData.inventory.length === 0) refreshShopData();
    }
  }, [activeTab]);

  const fetchOrders = async () => {
    try {
      const res = await shopFetch(shopData, `/orders/shop/${shopData._id}`);
      if (!res.ok) return;
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setOrders(list);
      try { sessionStorage.setItem(`shop_orders_${shopData._id}`, JSON.stringify(list)); } catch {}
    } catch (err) { console.log(err); }
  };

  const fetchMasterCatalog = async () => {
    setCatalogError(null);
    try {
      // ⚡ Safe limit so it loads in ~100ms instead of 40 seconds
      const res = await fetch(`${BASE_URL}/master-products?limit=150`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const items = Array.isArray(data) ? data : (data?.items || []);
      setMasterCatalog(items);
      try { sessionStorage.setItem(`shop_master_catalog`, JSON.stringify(items)); } catch {}
    } catch (err) {
      console.log(err);
      setCatalogError(err.message || "Failed to load catalog");
    } finally {
      setIsCatalogLoading(false);
    }
  };

  const refreshShopData = async () => {
    try {
      const res = await fetch(`${BASE_URL}/shops/${shopData._id}/menu`);
      if (res.ok) {
        const updated = await res.json();
        updateShopDataSafe(updated);
        cacheSlimInventory(shopData._id, updated.inventory);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setIsInventoryLoading(false);
    }
  };

  const fetchParchis = async () => {
    try {
      const res = await shopFetch(shopData, `/parchis/${shopData._id}`);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) setParchiRequests(data);
    } catch (err) { console.log(err); }
  };

  // --- LOGIC ---
  // ⚡ FIX #4 — mergeSlimShop: the server now returns a slim shop doc (no
  // populated inventory) for toggle/profile-patch so the response is instant.
  // We merge only the non-inventory fields so the existing populated inventory
  // stays in memory and the UI doesn't flicker.
  const mergeSlimShop = (slim) => {
    if (!slim) return;
    setShopData(prev => ({
      ...prev,
      ...slim,
      // Always keep existing inventory (populated) and sessionToken in memory
      inventory: prev?.inventory ?? slim.inventory ?? [],
      sessionToken: slim.sessionToken || prev?.sessionToken || shopData?.sessionToken,
    }));
  };

  const toggleShopStatus = async () => {
    const newStatus = !shopData.isOpen;
    // ⚡ Optimistic UI: flip instantly, server confirms
    setShopData(prev => ({ ...prev, isOpen: newStatus }));
    try {
      const res = await shopFetch(shopData, `/shops/${shopData._id}`, {
        method: "PATCH",
        body: JSON.stringify({ isOpen: newStatus })
      });
      if (res.ok) {
        const updated = await res.json();
        mergeSlimShop(updated);
      } else {
        if (res.status === 401) {
          toast("Session expired. Please log in again.", 'error');
          onExit?.();
          return;
        }
        // Revert on failure
        setShopData(prev => ({ ...prev, isOpen: !newStatus }));
        toast("Could not toggle store status.", 'error');
      }
    } catch (err) {
      setShopData(prev => ({ ...prev, isOpen: !newStatus }));
      console.log(err);
    }
  };

  // 🚀 THIS IS THE FIX: IT WILL INSTANTLY UPDATE THE SCREEN OR SCREAM THE ERROR AT YOU
  // Auth: every order mutation now carries the shop's bearer token. Cancel
  // intent is routed to the dedicated /shop-cancel endpoint so coin refunds
  // always fire — never via PATCH.
  const updateOrderStatus = async (orderId, newStatus) => {
    const authHeader = shopData.sessionToken ? { "Authorization": `Bearer ${shopData.sessionToken}` } : {};
    const isCancel = /cancel|reject/i.test(newStatus);

    try {
      // 1. Instantly change UI so it feels lightning fast
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));

      // 2. Tell the server
      const url = isCancel ? `${BASE_URL}/orders/${orderId}/shop-cancel` : `${BASE_URL}/orders/${orderId}`;
      const method = isCancel ? "POST" : "PATCH";
      const body = isCancel ? JSON.stringify({ reason: 'Cancelled by shop' }) : JSON.stringify({ status: newStatus });

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...authHeader },
        body,
      });

      // 3. Catch server errors
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        toast(errorData.error || "Server rejected the update", 'error');
        fetchOrders(); // Reload actual database state
      }
    } catch (err) {
      console.log(err);
      toast("Network error. Cannot reach server.", 'error');
    }
  };

  // Shop confirms a UPI payment landed in their UPI app. Flips the order's
  // paymentStatus from 'PendingVerification' to 'Paid' server-side and fires
  // a "payment confirmed" push to the customer. Only valid for UPI orders.
  const markOrderPaid = async (orderId) => {
    try {
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, paymentStatus: 'Paid' } : o));
      const res = await shopFetch(shopData, `/orders/${orderId}/mark-paid`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        toast(errorData.error || 'Could not mark as paid', 'error');
        fetchOrders();
      } else {
        toast('Payment confirmed ✅');
      }
    } catch (err) {
      console.log(err);
      toast('Network error. Cannot reach server.', 'error');
      fetchOrders();
    }
  };

  const handleInventoryUpdate = async (productId, sellingPrice, inStock = true, isFeatured = undefined, featuredRank = undefined) => {
    // ⚡ OPTIMISTIC UI: Update instantly in memory so the toggle or price responds in 0ms!
    setShopData(prev => {
      const inv = prev?.inventory || [];
      const updatedInv = inv.map(item => {
        const id = item?.product?._id || item?.product;
        if (String(id) === String(productId)) {
          return {
            ...item,
            sellingPrice: Number(sellingPrice),
            inStock: Boolean(inStock),
            ...(isFeatured !== undefined ? { isFeatured: Boolean(isFeatured) } : {}),
            ...(featuredRank !== undefined ? { featuredRank: Number(featuredRank) } : {}),
          };
        }
        return item;
      });
      return { ...prev, inventory: updatedInv };
    });

    try {
      const payload = { productId, sellingPrice: Number(sellingPrice), inStock };
      if (isFeatured !== undefined) payload.isFeatured = isFeatured;
      if (featuredRank !== undefined) payload.featuredRank = Number(featuredRank);

      const res = await shopFetch(shopData, `/shops/${shopData._id}/inventory`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const updated = await res.json().catch(() => ({}));
        if (Array.isArray(updated.inventory)) {
          setShopData(prev => ({ ...prev, inventory: updated.inventory }));
          cacheSlimInventory(shopData._id, updated.inventory);
        }
        toast("Store updated!");
      } else {
        if (res.status === 401) {
          toast("Session expired. Please log in again.", 'error');
          onExit?.();
          return;
        }
        const errorData = await res.json().catch(() => ({}));
        toast(errorData.error || "Failed to update", 'error');
        refreshShopData(); // revert optimistic update
      }
    } catch (err) {
      console.log(err);
      refreshShopData();
    }
  };

  const handleInventoryRemove = async (productId) => {
    // ⚡ OPTIMISTIC UI: Instantly remove from screen
    setShopData(prev => ({
      ...prev,
      inventory: (prev?.inventory || []).filter(item => String(item?.product?._id || item?.product) !== String(productId))
    }));

    try {
      const res = await shopFetch(shopData, `/shops/${shopData._id}/inventory/${productId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        const updated = await res.json().catch(() => ({}));
        if (Array.isArray(updated.inventory)) {
          setShopData(prev => ({ ...prev, inventory: updated.inventory }));
          cacheSlimInventory(shopData._id, updated.inventory);
        }
        toast("Item removed from store!");
      } else {
        if (res.status === 401) {
          toast("Session expired. Please log in again.", 'error');
          onExit?.();
          return;
        }
        const errorData = await res.json().catch(() => ({}));
        toast(errorData.error || "Failed to remove item", 'error');
        refreshShopData();
      }
    } catch (err) {
      console.log(err);
      refreshShopData();
    }
  };

  const handleAddToBill = (item) => {
    setParchiBill(prev => {
      const exists = prev.find(i => i._id === item.product._id);
      if (exists) return prev.map(i => i._id === item.product._id ? { ...i, qty: i.qty + 1 } : i);
      // Carry productId so the order schema can link the row to a real master
      // product downstream (receipts, timelines, "Buy It Again" widgets).
      return [...prev, { ...item.product, productId: item.product._id, price: item.sellingPrice || item.product.mrp, qty: 1 }];
    });
  };

  // Send the parchi bill to the customer. Posts to /parchis/:id/send-bill so
  // the customer gets a quote with a UPI-or-Pay-on-pickup choice — does NOT
  // create an order directly. The order is only created once the customer
  // accepts the bill on their side.
  const handleSendBill = async () => {
    if (!shopData.upiId || !shopData.upiId.includes('@')) {
      toast("Add your UPI ID in shop profile first so customers can pay you.", 'error');
      return;
    }
    try {
      const res = await shopFetch(shopData, `/parchis/${selectedParchi._id}/send-bill`, {
        method: "POST",
        body: JSON.stringify({
          items: parchiBill.map(i => ({ productId: i.productId || i._id, qty: i.qty })),
        }),
      });

      if (res.ok) {
        setParchiRequests(prev => prev.filter(p => p._id !== selectedParchi._id));
        setSelectedParchi(null);
        setParchiBill([]);
        toast(`Bill sent to ${selectedParchi.customerName || 'customer'}! Awaiting their payment choice.`);
      } else {
        const err = await res.json().catch(() => ({}));
        toast(err.error || "Failed to send the bill. Please try again.", 'error');
      }
    } catch (err) {
      console.log(err);
      toast("Something went wrong sending the bill.", 'error');
    }
  };

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '70px', fontFamily: 'sans-serif' }}>

      {/* TOP HEADER WITH SHOP AVATAR + NOTIFICATION BELL */}
      <div style={{ backgroundColor: '#0f172a', color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <button
          onClick={() => setPhotoModalOpen(true)}
          aria-label="Change shop photo"
          style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            background: 'transparent', border: 'none', padding: 0,
            cursor: 'pointer', color: 'inherit', textAlign: 'left',
            minWidth: 0,
          }}
        >
          <span style={{
            position: 'relative',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '44px', height: '44px', borderRadius: '50%',
            background: shopData.shopImage ? 'transparent' : 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(22,163,74,0.35)',
            border: '2px solid rgba(16,185,129,0.5)',
            flexShrink: 0,
          }}>
            {shopData.shopImage ? (
              <img
                src={cdnImage(shopData.shopImage, 160)}
                alt={shopData.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#fff' }}>
                {(shopData.name || '?').trim().charAt(0).toUpperCase()}
              </span>
            )}
            <span style={{
              position: 'absolute', bottom: '-2px', right: '-2px',
              background: '#10b981', borderRadius: '50%', padding: '3px',
              border: '2px solid #0f172a',
              display: 'inline-flex',
            }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
                <path d="M12 4v16M4 12h16" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </span>
          </span>
          <span style={{ minWidth: 0 }}>
            <span style={{ display: 'block', margin: 0, fontSize: '1.05rem', color: '#10b981', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
              {shopData.name}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Partner Dashboard</span>
          </span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <NotificationBell ownerType="shop" owner={shopData} />

          <button onClick={() => setProfileModalOpen(true)} title="Shop profile / UPI" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', width: 36, height: 36, borderRadius: '50%', fontSize: '1.05rem', cursor: 'pointer' }}>
            ⚙️
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <button onClick={toggleShopStatus} style={{ padding: '6px 12px', borderRadius: '20px', fontWeight: 'bold', border: 'none', cursor: 'pointer', backgroundColor: shopData.isOpen ? '#d1fae5' : '#fee2e2', color: shopData.isOpen ? '#059669' : '#b91c1c' }} >
              {shopData.isOpen ? '🟢 OPEN' : '🔴 CLOSED'}
            </button>
            {!shopData.isOpen && (
              <label style={{ fontSize: '0.65rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={shopData.acceptsPreOrders !== false}
                  onChange={async (e) => {
                    const accepts = e.target.checked;
                    // ⚡ Optimistic UI
                    setShopData(prev => ({ ...prev, acceptsPreOrders: accepts }));
                    const res = await shopFetch(shopData, `/shops/${shopData._id}`, {
                      method: "PATCH",
                      body: JSON.stringify({ acceptsPreOrders: accepts })
                    });
                    if (res.ok) {
                      const updated = await res.json();
                      mergeSlimShop(updated); // ⚡ FIX #4 — merge slim, keep inventory
                    }
                  }}
                  style={{ accentColor: '#10b981', cursor: 'pointer' }}
                />
                Accept Pre-Orders
              </label>
            )}
          </div>
          <button onClick={onExit} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </div>

      {/* 🗂️ TAB NAVIGATION */}
      <div style={{ display: 'flex', backgroundColor: '#1e293b', padding: '10px 15px', gap: '10px', overflowX: 'auto', whiteSpace: 'nowrap', borderBottom: '1px solid #334155' }}>
        <button onClick={() => setActiveTab("orders")} style={tabStyle(activeTab === "orders")}>📦 Live Orders ({orders.filter(o => o?.orderSource !== 'POS').length})</button>
        <button onClick={() => setActiveTab("pos")} style={{ ...tabStyle(activeTab === "pos"), backgroundColor: activeTab === "pos" ? '#059669' : '#064e3b', color: '#fff', border: '1px solid #34d399' }}>⚡ Counter POS {shopData.canUseCounterPos ? '🟢' : '🔒'}</button>
        <button
          onClick={() => setActiveTab("khata")}
          style={{
            ...tabStyle(activeTab === "khata"),
            backgroundColor: activeTab === "khata" ? '#d97706' : '#451a03',
            color: '#fff',
            border: '1px solid #f59e0b',
          }}
        >
          📒 Khata Book
          {(khataSummary?.pendingVerificationCount || 0) > 0 ? (
            <span style={badgeStyle}>{khataSummary.pendingVerificationCount}</span>
          ) : (khataSummary?.totalReceivable || 0) > 0 ? (
            <span style={{ backgroundColor: 'rgba(251,191,36,0.22)', color: '#fde68a', padding: '2px 7px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 900 }}>
              ₹{Math.round(khataSummary.totalReceivable)}
            </span>
          ) : null}
        </button>
        <button onClick={() => setActiveTab("parchis")} style={tabStyle(activeTab === "parchis")}>🧾 Parchis {parchiRequests.length > 0 && <span style={badgeStyle}>{parchiRequests.length}</span>}</button>
        <button onClick={() => setActiveTab("inventory")} style={tabStyle(activeTab === "inventory")}>📊 Manage Inventory</button>
        <button onClick={() => setActiveTab("combos")} style={{ ...tabStyle(activeTab === "combos"), backgroundColor: activeTab === "combos" ? '#d97706' : '#78350f', color: '#fff', border: '1px solid #f59e0b' }}>🎁 Combos Offers ✨</button>
        <button onClick={() => setActiveTab("requests")} style={tabStyle(activeTab === "requests")}>🛎️ Product Requests</button>
        <button onClick={() => setActiveTab("reviews")} style={tabStyle(activeTab === "reviews")}>⭐ Reviews</button>
        <button onClick={() => setActiveTab("complaints")} style={tabStyle(activeTab === "complaints")}>📣 Complaints</button>
      </div>

      <ShopLocationBanner shopData={shopData} onShopUpdated={updateShopDataSafe} />

      <div style={{ padding: '15px', maxWidth: (activeTab === "pos" || activeTab === "khata") ? '1140px' : '800px', margin: '0 auto' }}>
        {activeTab === "pos" && (
          <CounterPosTab
            shopData={shopData}
            masterCatalog={masterCatalog}
            orders={orders}
            khataSummary={khataSummary}
            onOpenKhataBook={(phone = '') => {
              setKhataFocusPhone(phone || '');
              setActiveTab("khata");
            }}
            onKhataChanged={() => {
              fetchKhataSummary();
              fetchOrders();
              setKhataRefreshSignal(s => s + 1);
            }}
            onBillCreated={(updatedShop, createdOrder) => {
              if (updatedShop) updateShopDataSafe(updatedShop);
              if (createdOrder) setOrders(prev => [createdOrder, ...prev]);
            }}
          />
        )}
        {activeTab === "khata" && (
          <KhataTab
            shopData={shopData}
            orders={orders}
            focusPhone={khataFocusPhone}
            onClearFocusPhone={() => setKhataFocusPhone('')}
            onKhataSummaryChange={setKhataSummary}
            onQuickPosBill={() => setActiveTab("pos")}
            refreshSignal={khataRefreshSignal}
          />
        )}
        {activeTab === "orders" && <OrdersTab orders={orders} updateOrderStatus={updateOrderStatus} markOrderPaid={markOrderPaid} shopData={shopData} refreshOrders={fetchOrders} />}
        {activeTab === "parchis" && <ParchiTab parchiRequests={parchiRequests} selectedParchi={selectedParchi} setSelectedParchi={setSelectedParchi} parchiBill={parchiBill} setParchiBill={setParchiBill} handleAddToBill={handleAddToBill} handleSendBill={handleSendBill} shopData={shopData} />}
        {activeTab === "inventory" && (
          <InventoryTab
            shopData={shopData}
            masterCatalog={masterCatalog}
            isCatalogLoading={isCatalogLoading}
            catalogError={catalogError}
            isInventoryLoading={isInventoryLoading}
            handleInventoryUpdate={handleInventoryUpdate}
            handleInventoryRemove={handleInventoryRemove}
            onInventoryRefresh={refreshShopData}
            fetchMasterCatalog={fetchMasterCatalog}
          />
        )}
        {activeTab === "requests" && <RequestsTab shopData={shopData} />}
        {activeTab === "combos" && <CombosTab shopData={shopData} masterCatalog={masterCatalog} onComboRefresh={refreshShopData} />}
        {activeTab === "reviews" && <ShopReviews shopId={shopData._id} shopRating={shopData.rating} totalReviews={shopData.totalReviews} />}
        {activeTab === "complaints" && <ComplaintsTab shop={shopData} />}
      </div>

      <ShopPhotoModal
        open={photoModalOpen}
        onClose={() => setPhotoModalOpen(false)}
        shop={shopData}
        onShopUpdated={updateShopDataSafe}
      />

      <ShopProfileModal
        open={profileModalOpen}
        shop={shopData}
        onClose={() => setProfileModalOpen(false)}
        onShopUpdated={updateShopDataSafe}
      />
    </div>
  );
}

const tabStyle = (isActive) => ({ backgroundColor: isActive ? 'rgba(255,255,255,0.1)' : 'transparent', color: isActive ? '#38bdf8' : '#cbd5e1', border: 'none', padding: '8px 15px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s', display: 'flex', alignItems: 'center', gap: '8px' });
const badgeStyle = { backgroundColor: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 'bold' };

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
import { cdnImage } from './utils/cloudinaryUrl.js';

export default function ShopDashboard({ user, onExit }) {
  const toast = useToast();
  // --- STATE ---
  const [activeTab, setActiveTab] = useState("orders");
  const [orders, setOrders] = useState([]); 
  const [masterCatalog, setMasterCatalog] = useState([]); 
  const [shopData, setShopData] = useState(user); 

  const [parchiRequests, setParchiRequests] = useState([]);
  const [selectedParchi, setSelectedParchi] = useState(null);
  const [parchiBill, setParchiBill] = useState([]);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);

  const BASE_URL = (import.meta.env.VITE_API_BASE || "https://darkslategrey-snail-415133.hostingersite.com");

  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchAllData = async () => {
      await fetchOrders();
      await fetchMasterCatalog();
      await fetchParchis();
    };
    fetchAllData();

    const interval = setInterval(() => {
      fetchOrders();
      fetchParchis();
    }, 10000);
    return () => clearInterval(interval);
  }, [shopData._id]);

  const fetchOrders = async () => { 
    try { 
      const res = await fetch(`${BASE_URL}/orders`); 
      const allOrders = await res.json(); 
      setOrders(allOrders.filter(o => o.shopId?._id === shopData._id)); 
    } catch (err) { console.log(err); } 
  }; 

  const fetchMasterCatalog = async () => {
    try {
      const res = await fetch(`${BASE_URL}/master-products`);
      setMasterCatalog(await res.json());
    } catch (err) { console.log(err); }
  };

  const refreshShopData = async () => {
    try {
      const res = await fetch(`${BASE_URL}/shops/${shopData._id}/menu`);
      if (res.ok) setShopData(await res.json());
    } catch (err) { console.log(err); }
  };

  const fetchParchis = async () => {
    try {
      const res = await fetch(`${BASE_URL}/parchis/${shopData._id}`);
      const data = await res.json();
      if (Array.isArray(data)) setParchiRequests(data);
    } catch (err) { console.log(err); }
  };

  // --- LOGIC ---
  const toggleShopStatus = async () => { 
    const newStatus = !shopData.isOpen; 
    try { 
      const res = await fetch(`${BASE_URL}/shops/${shopData._id}`, { 
        method: "PATCH", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ isOpen: newStatus }) 
      }); 
      setShopData(await res.json()); 
    } catch (err) { console.log(err); } 
  }; 

  // 🚀 THIS IS THE FIX: IT WILL INSTANTLY UPDATE THE SCREEN OR SCREAM THE ERROR AT YOU
  // Auth: every order mutation now carries the shop's bearer token. Cancel
  // intent is routed to the dedicated /shop-cancel endpoint so coin/Razorpay
  // refunds always fire — never via PATCH.
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

  const handleInventoryUpdate = async (productId, sellingPrice, inStock = true) => { 
    try { 
      const res = await fetch(`${BASE_URL}/shops/${shopData._id}/inventory`, { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ productId, sellingPrice: Number(sellingPrice), inStock }) 
      }); 
      if (res.ok) {
        setShopData(await res.json());
        toast("Store updated!");
      } else {
        const errorData = await res.json();
        toast(errorData.error || "Failed to update", 'error');
      }
    } catch (err) { console.log(err); }
  }; 

  const handleAddToBill = (item) => {
    setParchiBill(prev => {
      const exists = prev.find(i => i._id === item.product._id);
      if (exists) return prev.map(i => i._id === item.product._id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...item.product, price: item.sellingPrice || item.product.mrp, qty: 1 }];
    });
  };

  const handleSendBill = async () => {
    const totalAmount = parchiBill.reduce((sum, i) => sum + (i.price * i.qty), 0);
    
    try {
      const res = await fetch(`${BASE_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedParchi.userId,    
          shopId: shopData._id,             
          items: parchiBill,                
          totalAmount: totalAmount,         
          status: "Pending",                
          imageUrl: selectedParchi.imageUrl 
        })
      });

      if (res.ok) {
        setParchiRequests(prev => prev.filter(p => p._id !== selectedParchi._id));
        setSelectedParchi(null);
        setParchiBill([]);
        fetchOrders();
        toast(`Digital bill sent to ${selectedParchi.customerName || 'customer'}!`);
      } else {
        toast("Failed to create the order. Please try again.", 'error');
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
          <NotificationBell ownerType="shop" ownerId={shopData._id} />

          <button onClick={toggleShopStatus} style={{ padding: '6px 12px', borderRadius: '20px', fontWeight: 'bold', border: 'none', cursor: 'pointer', backgroundColor: shopData.isOpen ? '#d1fae5' : '#fee2e2', color: shopData.isOpen ? '#059669' : '#b91c1c' }} >
            {shopData.isOpen ? '🟢 OPEN' : '🔴 CLOSED'}
          </button>
          <button onClick={onExit} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </div>

      {/* 🗂️ TAB NAVIGATION (NEW REVIEWS TAB ADDED) */}
      <div className="hide-scroll" style={{ display: 'flex', backgroundColor: '#1e293b', padding: '10px 20px', gap: '15px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
        <button onClick={() => setActiveTab("orders")} style={tabStyle(activeTab === "orders")}>📦 Live Orders ({orders.length})</button>
        <button onClick={() => setActiveTab("parchis")} style={tabStyle(activeTab === "parchis")}>🧾 Parchis {parchiRequests.length > 0 && <span style={badgeStyle}>{parchiRequests.length}</span>}</button>
        <button onClick={() => setActiveTab("inventory")} style={tabStyle(activeTab === "inventory")}>📊 Manage Inventory</button>
        <button onClick={() => setActiveTab("reviews")} style={tabStyle(activeTab === "reviews")}>⭐ Reviews</button>
        <button onClick={() => setActiveTab("complaints")} style={tabStyle(activeTab === "complaints")}>📣 Complaints</button>
      </div>

      <div style={{ padding: '15px', maxWidth: '800px', margin: '0 auto' }}> 
        {activeTab === "orders" && <OrdersTab orders={orders} updateOrderStatus={updateOrderStatus} />}
        {activeTab === "parchis" && <ParchiTab parchiRequests={parchiRequests} selectedParchi={selectedParchi} setSelectedParchi={setSelectedParchi} parchiBill={parchiBill} setParchiBill={setParchiBill} handleAddToBill={handleAddToBill} handleSendBill={handleSendBill} shopData={shopData} />}
        {activeTab === "inventory" && <InventoryTab shopData={shopData} masterCatalog={masterCatalog} handleInventoryUpdate={handleInventoryUpdate} onInventoryRefresh={refreshShopData} />}
        {activeTab === "reviews" && <ShopReviews shopId={shopData._id} shopRating={shopData.rating} totalReviews={shopData.totalReviews} />}
        {activeTab === "complaints" && <ComplaintsTab shopId={shopData._id} shopName={shopData.name} />}
      </div>

      <ShopPhotoModal
        open={photoModalOpen}
        onClose={() => setPhotoModalOpen(false)}
        shop={shopData}
        onShopUpdated={(updated) => setShopData(updated)}
      />
    </div>
  );
}

const tabStyle = (isActive) => ({ backgroundColor: isActive ? 'rgba(255,255,255,0.1)' : 'transparent', color: isActive ? '#38bdf8' : '#cbd5e1', border: 'none', padding: '8px 15px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s', display: 'flex', alignItems: 'center', gap: '8px' });
const badgeStyle = { backgroundColor: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 'bold' };

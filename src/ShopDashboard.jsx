import React, { useState, useEffect } from 'react';

// 🔗 IMPORTING YOUR WORKERS!
import OrdersTab from './components/ShopDashboard/OrdersTab';
import ParchiTab from './components/ShopDashboard/ParchiTab';
import InventoryTab from './components/ShopDashboard/InventoryTab';
import NotificationBell from './NotificationBell'; 
// 🌟 IMPORT THE NEW REVIEWS COMPONENT
import ShopReviews from './components/ShopDashboard/ShopReviews'; 

export default function ShopDashboard({ user, onExit }) {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState("orders"); 
  const [orders, setOrders] = useState([]); 
  const [masterCatalog, setMasterCatalog] = useState([]); 
  const [shopData, setShopData] = useState(user); 

  const [parchiRequests, setParchiRequests] = useState([]); 
  const [selectedParchi, setSelectedParchi] = useState(null);
  const [parchiBill, setParchiBill] = useState([]);

  const BASE_URL = "https://darkslategrey-snail-415133.hostingersite.com";

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
  const updateOrderStatus = async (orderId, newStatus) => { 
    try { 
      // 1. Instantly change UI so it feels lightning fast
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));

      // 2. Tell the server
      const res = await fetch(`${BASE_URL}/orders/${orderId}`, { 
        method: "PATCH", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ status: newStatus }) 
      }); 

      // 3. Catch server errors
      if (!res.ok) {
        const errorData = await res.json();
        alert("BACKEND REJECTED IT: " + (errorData.error || "Unknown Error"));
        fetchOrders(); // Reload actual database state
      }
    } catch (err) { 
      console.log(err); 
      alert("NETWORK ERROR: Cannot reach Hostinger server.");
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
        alert("✅ Store Updated!"); 
      } else { 
        const errorData = await res.json(); 
        alert("❌ Error: " + (errorData.error || "Failed to update")); 
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
        alert(`✅ Digital Bill Sent to ${selectedParchi.customerName || 'Customer'}!`);
      } else {
        alert("❌ Failed to create the order. Please try again.");
      }
    } catch (err) {
      console.log(err);
      alert("❌ Something went wrong sending the bill.");
    }
  };

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '70px', fontFamily: 'sans-serif' }}>
      
      {/* 🏪 TOP HEADER WITH NOTIFICATION BELL */}
      <div style={{ backgroundColor: '#0f172a', color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}> 
        <div> 
          <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#10b981' }}>🏪 {shopData.name}</h2> 
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Partner Dashboard</span> 
        </div> 
        
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
      </div>

      <div style={{ padding: '15px', maxWidth: '800px', margin: '0 auto' }}> 
        {activeTab === "orders" && <OrdersTab orders={orders} updateOrderStatus={updateOrderStatus} />}
        {activeTab === "parchis" && <ParchiTab parchiRequests={parchiRequests} selectedParchi={selectedParchi} setSelectedParchi={setSelectedParchi} parchiBill={parchiBill} setParchiBill={setParchiBill} handleAddToBill={handleAddToBill} handleSendBill={handleSendBill} shopData={shopData} />}
        {activeTab === "inventory" && <InventoryTab shopData={shopData} masterCatalog={masterCatalog} handleInventoryUpdate={handleInventoryUpdate} />}
        {activeTab === "reviews" && <ShopReviews shopId={shopData._id} shopRating={shopData.rating} totalReviews={shopData.totalReviews} />}
      </div>
    </div>
  );
}

const tabStyle = (isActive) => ({ backgroundColor: isActive ? 'rgba(255,255,255,0.1)' : 'transparent', color: isActive ? '#38bdf8' : '#cbd5e1', border: 'none', padding: '8px 15px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s', display: 'flex', alignItems: 'center', gap: '8px' });
const badgeStyle = { backgroundColor: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 'bold' };

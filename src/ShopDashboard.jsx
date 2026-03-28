import React, { useState, useEffect } from 'react';

// 🔗 IMPORTING YOUR NEW WORKERS!
import OrdersTab from './components/ShopDashboard/OrdersTab';
import ParchiTab from './components/ShopDashboard/ParchiTab';
import InventoryTab from './components/ShopDashboard/InventoryTab';

export default function ShopDashboard({ user, onExit }) {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState("parchis"); 
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

  const updateOrderStatus = async (orderId, newStatus) => { 
    try { 
      const res = await fetch(`${BASE_URL}/orders/${orderId}`, { 
        method: "PATCH", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ status: newStatus }) 
      }); 
      if (res.ok) fetchOrders(); 
    } catch (err) { console.log(err); } 
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

  const handleSendBill = () => {
    alert(`✅ Digital Bill Sent to ${selectedParchi.customerName || 'Customer'}! They will receive a notification to pay ₹${parchiBill.reduce((sum, i) => sum + (i.price * i.qty), 0)}.`);
    setParchiRequests(prev => prev.filter(p => p._id !== selectedParchi._id));
    setSelectedParchi(null);
    setParchiBill([]);
  };

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '70px', fontFamily: 'sans-serif' }}>
      
      {/* 🏪 TOP HEADER */}
      <div style={{ backgroundColor: '#0f172a', color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}> 
        <div> 
          <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#10b981' }}>🏪 {shopData.name}</h2> 
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Partner Dashboard</span> 
        </div> 
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}> 
          <button onClick={toggleShopStatus} style={{ padding: '6px 12px', borderRadius: '20px', fontWeight: 'bold', border: 'none', cursor: 'pointer', backgroundColor: shopData.isOpen ? '#d1fae5' : '#fee2e2', color: shopData.isOpen ? '#059669' : '#b91c1c' }} > 
            {shopData.isOpen ? '🟢 OPEN' : '🔴 CLOSED'} 
          </button> 
          <button onClick={onExit} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold' }}>Logout</button> 
        </div> 
      </div> 

      {/* 🗂️ TAB NAVIGATION */}
      <div style={{ display: 'flex', backgroundColor: '#1e293b', padding: '10px 20px', gap: '15px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
        <button onClick={() => setActiveTab("orders")} style={tabStyle(activeTab === "orders")}>📦 Live Orders ({orders.length})</button>
        <button onClick={() => setActiveTab("parchis")} style={tabStyle(activeTab === "parchis")}>🧾 Parchis {parchiRequests.length > 0 && <span style={badgeStyle}>{parchiRequests.length}</span>}</button>
        <button onClick={() => setActiveTab("inventory")} style={tabStyle(activeTab === "inventory")}>📊 Manage Inventory</button>
      </div>

      <div style={{ padding: '15px', maxWidth: '800px', margin: '0 auto' }}> 
        
        {/* 🚀 LOOK HOW CLEAN THIS IS NOW! */}
        {activeTab === "orders" && (
          <OrdersTab orders={orders} updateOrderStatus={updateOrderStatus} />
        )}

        {activeTab === "parchis" && (
          <ParchiTab 
            parchiRequests={parchiRequests}
            selectedParchi={selectedParchi}
            setSelectedParchi={setSelectedParchi}
            parchiBill={parchiBill}
            setParchiBill={setParchiBill}
            handleAddToBill={handleAddToBill}
            handleSendBill={handleSendBill}
            shopData={shopData}
          />
        )}

        {activeTab === "inventory" && (
          <InventoryTab 
            shopData={shopData} 
            masterCatalog={masterCatalog} 
            handleInventoryUpdate={handleInventoryUpdate} 
          />
        )}

      </div>
    </div>
  );
}

// Styling Helpers for the Nav Bar
const tabStyle = (isActive) => ({ backgroundColor: isActive ? 'rgba(255,255,255,0.1)' : 'transparent', color: isActive ? '#38bdf8' : '#cbd5e1', border: 'none', padding: '8px 15px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s', display: 'flex', alignItems: 'center', gap: '8px' });
const badgeStyle = { backgroundColor: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 'bold' };

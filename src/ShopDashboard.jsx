import React, { useState } from 'react';

export default function ShopDashboard({ onExit }) {
  const [currentTab, setCurrentTab] = useState("orders");
  const [isShopOpen, setIsShopOpen] = useState(true);

  // 🔔 NEW: Controls what we see inside the "My Shelf" tab
  const [inventoryView, setInventoryView] = useState("menu"); // 'menu' or 'requestForm'
  
  // Form State for Requesting Custom Items
  const [reqName, setReqName] = useState("");
  const [reqPrice, setReqPrice] = useState("");
  const [status, setStatus] = useState("");

  // 🚀 The Magic Function: Sends the request to the Super Admin!
  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setStatus("⏳ Sending request to Super Admin...");
    
    try {
      const res = await fetch("https://darkslategrey-snail-415133.hostingersite.com/product-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // We use a dummy 24-character MongoDB ID for this tutorial shop
        body: JSON.stringify({ 
          shopId: "5f8d0d55b54764421b7156c9", 
          requestedName: reqName, 
          requestedSellingPrice: Number(reqPrice) 
        })
      });
      
      if(res.ok) {
        setStatus("✅ Request sent! Admin will review it shortly.");
        setReqName("");
        setReqPrice("");
        // Send them back to the menu after 2.5 seconds
        setTimeout(() => {
          setStatus("");
          setInventoryView("menu");
        }, 2500);
      }
    } catch (err) {
      setStatus("❌ Failed to send request.");
    }
  };

  // 📦 TAB 1: LIVE ORDERS
  if (currentTab === "orders") {
    return (
      <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif', paddingBottom: '70px' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          <div><h1 style={{ margin: 0, fontSize: '1.4rem', color: '#0f172a' }}>🏪 Sharma Groceries</h1><span style={{ fontSize: '0.8rem', color: '#64748b' }}>ID: SH-110001</span></div>
          <button onClick={onExit} style={{ backgroundColor: '#f1f5f9', color: '#475569', border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: 'bold' }}>Logout</button>
        </div>

        <div style={{ padding: '20px' }}>
          {/* STORE TOGGLE */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: isShopOpen ? '#dcfce7' : '#fee2e2', padding: '15px', borderRadius: '12px', marginBottom: '20px' }}>
            <span style={{ fontWeight: 'bold', color: isShopOpen ? '#166534' : '#991b1b' }}>{isShopOpen ? '🟢 Accepting Orders' : '🔴 Store Closed'}</span>
            <button onClick={() => setIsShopOpen(!isShopOpen)} style={{ backgroundColor: isShopOpen ? '#16a34a' : '#ef4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold' }}>Turn {isShopOpen ? 'OFF' : 'ON'}</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
            <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderBottom: '4px solid #3b82f6' }}><p style={{ margin: '0 0 5px 0', fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold' }}>TODAY'S ORDERS</p><h2 style={{ margin: 0, fontSize: '2rem', color: '#0f172a' }}>14</h2></div>
            <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderBottom: '4px solid #10b981' }}><p style={{ margin: '0 0 5px 0', fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold' }}>TODAY'S SALES</p><h2 style={{ margin: 0, fontSize: '2rem', color: '#0f172a' }}>₹1,450</h2></div>
          </div>

          <h3 style={{ fontSize: '1.1rem', color: '#334155', marginBottom: '15px' }}>🚨 Pending Parchis (1)</h3>
          <div style={{ backgroundColor: '#ffffff', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: '4px solid #f59e0b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}><span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Order #1043</span><span style={{ color: '#d97706', backgroundColor: '#fef3c7', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>Waiting...</span></div>
            <p style={{ margin: '0 0 15px 0', color: '#475569', fontSize: '0.9rem' }}>Customer: Rahul (110001) • 3 Items • <strong>₹320</strong></p>
            <div style={{ display: 'flex', gap: '10px' }}><button style={{ flex: 1, padding: '10px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>✅ Accept & Pack</button><button style={{ padding: '10px', backgroundColor: '#f1f5f9', color: '#ef4444', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>Reject</button></div>
          </div>
        </div>

        <div style={{ position: 'fixed', bottom: 0, width: '100%', backgroundColor: '#ffffff', display: 'flex', borderTop: '1px solid #e2e8f0' }}>
          <button onClick={() => setCurrentTab("orders")} style={{ flex: 1, padding: '15px', backgroundColor: 'transparent', border: 'none', borderBottom: currentTab === "orders" ? '3px solid #3b82f6' : 'none', color: currentTab === "orders" ? '#3b82f6' : '#64748b', fontWeight: 'bold' }}>📦 Orders</button>
          <button onClick={() => setCurrentTab("inventory")} style={{ flex: 1, padding: '15px', backgroundColor: 'transparent', border: 'none', borderBottom: currentTab === "inventory" ? '3px solid #3b82f6' : 'none', color: currentTab === "inventory" ? '#3b82f6' : '#64748b', fontWeight: 'bold' }}>🛒 My Shelf</button>
        </div>
      </div>
    );
  }

  // 🛒 TAB 2: INVENTORY
  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif', paddingBottom: '70px' }}>
       <div style={{ backgroundColor: '#ffffff', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <h1 style={{ margin: 0, fontSize: '1.4rem', color: '#0f172a' }}>My Shelf</h1>
      </div>
      
      <div style={{ padding: '20px' }}>
        
        {/* VIEW A: THE MENU */}
        {inventoryView === "menu" && (
          <>
            <button style={{ width: '100%', padding: '15px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '1rem', marginBottom: '15px', boxShadow: '0 4px 6px rgba(59, 130, 246, 0.3)' }}>
              🔍 Add from Master Catalog
            </button>
            
            {/* THIS BUTTON NOW CHANGES THE VIEW! */}
            <button onClick={() => setInventoryView("requestForm")} style={{ width: '100%', padding: '15px', backgroundColor: '#ffffff', color: '#a855f7', border: '2px dashed #a855f7', borderRadius: '10px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>
              ➕ Request Custom Item
            </button>
          </>
        )}

        {/* VIEW B: THE REQUEST FORM */}
        {inventoryView === "requestForm" && (
          <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
            <button onClick={() => setInventoryView("menu")} style={{ background: 'none', border: 'none', color: '#64748b', fontWeight: 'bold', marginBottom: '15px', padding: 0, cursor: 'pointer' }}>⬅ Back</button>
            <h3 style={{ margin: '0 0 15px 0', color: '#0f172a' }}>Request Item</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '15px' }}>If an item is missing from the Master Catalog, request it here. The Super Admin will add it shortly.</p>
            
            <form onSubmit={handleRequestSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input type="text" placeholder="Item Name (e.g. Local Rusk)" value={reqName} onChange={e => setReqName(e.target.value)} required style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
              <input type="number" placeholder="Your Selling Price (₹)" value={reqPrice} onChange={e => setReqPrice(e.target.value)} required style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
              <button type="submit" style={{ padding: '14px', backgroundColor: '#a855f7', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>Send to Admin</button>
            </form>
            {status && <p style={{ textAlign: 'center', color: '#d97706', marginTop: '15px', fontWeight: 'bold' }}>{status}</p>}
          </div>
        )}

      </div>

      <div style={{ position: 'fixed', bottom: 0, width: '100%', backgroundColor: '#ffffff', display: 'flex', borderTop: '1px solid #e2e8f0' }}>
        <button onClick={() => setCurrentTab("orders")} style={{ flex: 1, padding: '15px', backgroundColor: 'transparent', border: 'none', borderBottom: currentTab === "orders" ? '3px solid #3b82f6' : 'none', color: currentTab === "orders" ? '#3b82f6' : '#64748b', fontWeight: 'bold' }}>📦 Orders</button>
        <button onClick={() => setCurrentTab("inventory")} style={{ flex: 1, padding: '15px', backgroundColor: 'transparent', border: 'none', borderBottom: currentTab === "inventory" ? '3px solid #3b82f6' : 'none', color: currentTab === "inventory" ? '#3b82f6' : '#64748b', fontWeight: 'bold' }}>🛒 My Shelf</button>
      </div>
    </div>
  );
}

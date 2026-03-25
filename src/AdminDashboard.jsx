import React, { useState } from 'react';

export default function AdminDashboard({ onExit }) {
  // Navigation State: 'overview', 'analytics', or 'addShop'
  const [currentView, setCurrentView] = useState("overview"); 
  
  // Form State
  const [shopName, setShopName] = useState("");
  const [pincode, setPincode] = useState("");
  const [status, setStatus] = useState("");

  const handleAddShop = async (e) => {
    e.preventDefault();
    setStatus("⏳ Saving to MongoDB...");
    try {
      const response = await fetch("https://darkslategrey-snail-415133.hostingersite.com/shops", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: shopName, pincode: pincode })
      });
      if(response.ok) {
        setStatus("✅ Shop saved successfully!");
        setShopName(""); setPincode("");
        setTimeout(() => { setStatus(""); setCurrentView("overview"); }, 2000); 
      }
    } catch (err) { setStatus("❌ Database connection failed."); }
  };

  // --- 🔴 VIEW 1: ADD SHOP FORM ---
  if (currentView === "addShop") {
    return (
      <div style={{ backgroundColor: '#0f172a', minHeight: '100vh', color: '#f8fafc', padding: '20px', fontFamily: 'sans-serif' }}>
        <button onClick={() => setCurrentView("overview")} style={{ backgroundColor: '#334155', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', marginBottom: '20px', cursor: 'pointer' }}>⬅ Back</button>
        <h2 style={{ color: '#38bdf8', margin: '0 0 20px 0' }}>🏪 Register New Shop</h2>
        <form onSubmit={handleAddShop} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input type="text" placeholder="Shop Name" value={shopName} onChange={(e) => setShopName(e.target.value)} required style={{ padding: '14px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1e293b', color: 'white', outline: 'none' }} />
          <input type="text" placeholder="Service Pincode" value={pincode} onChange={(e) => setPincode(e.target.value)} required style={{ padding: '14px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1e293b', color: 'white', outline: 'none' }} />
          <button type="submit" style={{ padding: '15px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>Save to Database</button>
        </form>
        {status && <p style={{ marginTop: '20px', textAlign: 'center', fontWeight: 'bold', color: '#fef08a' }}>{status}</p>}
      </div>
    );
  }

  // --- 🟡 VIEW 2: DATA ANALYTICS SYSTEM ---
  if (currentView === "analytics") {
    return (
      <div style={{ backgroundColor: '#0f172a', minHeight: '100vh', color: '#f8fafc', padding: '20px', fontFamily: 'sans-serif' }}>
        <button onClick={() => setCurrentView("overview")} style={{ backgroundColor: '#334155', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', marginBottom: '20px', cursor: 'pointer' }}>⬅ Back</button>
        <h2 style={{ color: '#f59e0b', margin: '0 0 20px 0' }}>📊 Data & Insights</h2>

        {/* Analytics Card 1: Area Trends */}
        <div style={{ backgroundColor: '#1e293b', padding: '15px', borderRadius: '12px', marginBottom: '15px', borderLeft: '4px solid #f59e0b' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem' }}>📍 Top Products by Area</h3>
          <select style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', color: 'white', border: '1px solid #334155', borderRadius: '6px', marginBottom: '15px' }}>
            <option>Pincode: 110001 (Kawwa Bagh)</option>
            <option>Pincode: 110002</option>
          </select>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '8px', marginBottom: '8px' }}>
            <span>1. Maggi 2-Min Noodles</span> <span style={{ color: '#10b981', fontWeight: 'bold' }}>420 units</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '8px', marginBottom: '8px' }}>
            <span>2. Aashirvaad Atta 5kg</span> <span style={{ color: '#10b981', fontWeight: 'bold' }}>185 units</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>3. Cadbury Dairy Milk</span> <span style={{ color: '#10b981', fontWeight: 'bold' }}>95 units</span>
          </div>
        </div>

        {/* Analytics Card 2: Shop Performance */}
        <div style={{ backgroundColor: '#1e293b', padding: '15px', borderRadius: '12px', borderLeft: '4px solid #38bdf8' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem' }}>🏪 Shop Fulfillment Health</h3>
          <p style={{ margin: '0 0 5px 0', fontSize: '0.85rem', color: '#94a3b8' }}>Sharma Groceries</p>
          <div style={{ width: '100%', backgroundColor: '#0f172a', borderRadius: '10px', height: '10px', marginBottom: '15px' }}>
            <div style={{ width: '92%', backgroundColor: '#10b981', height: '100%', borderRadius: '10px' }}></div>
          </div>
          <p style={{ margin: '0 0 5px 0', fontSize: '0.85rem', color: '#94a3b8' }}>Rahul Electronics</p>
          <div style={{ width: '100%', backgroundColor: '#0f172a', borderRadius: '10px', height: '10px' }}>
            <div style={{ width: '65%', backgroundColor: '#ef4444', height: '100%', borderRadius: '10px' }}></div>
          </div>
        </div>
      </div>
    );
  }

  // --- 🟢 VIEW 3: MAIN DASHBOARD (Overview) ---
  return (
    <div style={{ backgroundColor: '#0f172a', minHeight: '100vh', color: '#f8fafc', padding: '20px', fontFamily: 'sans-serif' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '15px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#38bdf8' }}>⚙️ Command Center</h1>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Super Admin Authority</span>
        </div>
        <button onClick={onExit} style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold' }}>Exit</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
        <div style={{ backgroundColor: '#1e293b', padding: '15px', borderRadius: '12px', borderLeft: '4px solid #38bdf8' }}><p style={{ margin: '0 0 5px 0', fontSize: '0.8rem', color: '#cbd5e1' }}>TODAY'S ORDERS</p><h2 style={{ margin: 0, fontSize: '1.8rem' }}>0</h2></div>
        <div style={{ backgroundColor: '#1e293b', padding: '15px', borderRadius: '12px', borderLeft: '4px solid #10b981' }}><p style={{ margin: '0 0 5px 0', fontSize: '0.8rem', color: '#cbd5e1' }}>MONTHLY REVENUE</p><h2 style={{ margin: 0, fontSize: '1.8rem' }}>₹0</h2></div>
      </div>

      <h3 style={{ fontSize: '1.1rem', marginBottom: '15px', color: '#94a3b8' }}>System Controls</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '30px' }}>
        
        {/* The New Analytics Button! */}
        <button onClick={() => setCurrentView("analytics")} style={{ backgroundColor: '#f59e0b', color: 'white', border: 'none', padding: '15px', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}>
          <span>📊 Open Data & Analytics</span> <span>→</span>
        </button>

        <button onClick={() => setCurrentView("addShop")} style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '15px', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}>
          <span>🏪 Add New Shop</span> <span>+</span>
        </button>
        
        <button style={{ backgroundColor: '#8b5cf6', color: 'white', border: 'none', padding: '15px', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
          <span>📦 Add Master Product</span> <span>+</span>
        </button>
      </div>

    </div>
  );
}

import React, { useState, useEffect } from 'react';

export default function AdminDashboard({ onExit }) {
  const [activeTab, setActiveTab] = useState("products");
  const [msg, setMsg] = useState("");

  // Form States
  const [prodForm, setProdForm] = useState({ name: "", brand: "", category: "Snacks", mrp: "", qnty: "", emoji: "📦", searchTags: "" });
  const [shopForm, setShopForm] = useState({ name: "", pincode: "", phone: "" });

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setMsg("⏳ Adding product...");
    try {
      const res = await fetch("https://darkslategrey-snail-415133.hostingersite.com/master-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prodForm)
      });
      if (res.ok) {
        setMsg("✅ Product Added to Global Catalog!");
        setProdForm({ name: "", brand: "", category: "Snacks", mrp: "", qnty: "", emoji: "📦", searchTags: "" });
      }
    } catch (err) { setMsg("❌ Error adding product"); }
  };

  const handleAddShop = async (e) => {
    e.preventDefault();
    setMsg("⏳ Registering Shop...");
    try {
      const res = await fetch("https://darkslategrey-snail-415133.hostingersite.com/shops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shopForm)
      });
      if (res.ok) {
        setMsg(`✅ Shop "${shopForm.name}" Registered Successfully!`);
        setShopForm({ name: "", pincode: "", phone: "" });
      }
    } catch (err) { setMsg("❌ Error registering shop"); }
  };

  return (
    <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      {/* HEADER */}
      <div style={{ backgroundColor: '#1e272e', color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>🚩 Super Admin Vault</h2>
        <button onClick={onExit} style={{ backgroundColor: '#ff3f34', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>Logout</button>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', backgroundColor: 'white', borderBottom: '1px solid #ddd' }}>
        <button onClick={() => setActiveTab("products")} style={{ flex: 1, padding: '15px', border: 'none', background: activeTab === "products" ? '#fff' : '#f9f9f9', borderBottom: activeTab === "products" ? '3px solid #05c46b' : 'none', fontWeight: 'bold', cursor: 'pointer' }}>📦 Products</button>
        <button onClick={() => setActiveTab("shops")} style={{ flex: 1, padding: '15px', border: 'none', background: activeTab === "shops" ? '#fff' : '#f9f9f9', borderBottom: activeTab === "shops" ? '3px solid #05c46b' : 'none', fontWeight: 'bold', cursor: 'pointer' }}>🏪 Shops</button>
      </div>

      {msg && <div style={{ margin: '15px', padding: '10px', backgroundColor: '#dff9fb', color: '#130f40', borderRadius: '5px', textAlign: 'center', fontWeight: 'bold' }}>{msg}</div>}

      <div style={{ padding: '20px' }}>
        {activeTab === "products" ? (
          <form onSubmit={handleAddProduct} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <h3>Add to Global Catalog</h3>
            <input placeholder="Product Name" value={prodForm.name} onChange={e => setProdForm({...prodForm, name: e.target.value})} style={inputStyle} required />
            <input placeholder="Brand" value={prodForm.brand} onChange={e => setProdForm({...prodForm, brand: e.target.value})} style={inputStyle} required />
            <input placeholder="MRP (Price)" type="number" value={prodForm.mrp} onChange={e => setProdForm({...prodForm, mrp: e.target.value})} style={inputStyle} required />
            <input placeholder="Quantity (e.g. 500g, 1L)" value={prodForm.qnty} onChange={e => setProdForm({...prodForm, qnty: e.target.value})} style={inputStyle} required />
            <input placeholder="Emoji (e.g. 🍫)" value={prodForm.emoji} onChange={e => setProdForm({...prodForm, emoji: e.target.value})} style={inputStyle} />
            <button type="submit" style={btnStyle}>Update Global Catalog</button>
          </form>
        ) : (
          <form onSubmit={handleAddShop} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <h3>Register New Shop Partner</h3>
            <input placeholder="Shop Name" value={shopForm.name} onChange={e => setShopForm({...shopForm, name: e.target.value})} style={inputStyle} required />
            <input placeholder="Pincode" value={shopForm.pincode} onChange={e => setShopForm({...shopForm, pincode: e.target.value})} style={inputStyle} required />
            <input placeholder="Shop Phone Number" value={shopForm.phone} onChange={e => setShopForm({...shopForm, phone: e.target.value})} style={inputStyle} required />
            <button type="submit" style={{ ...btnStyle, backgroundColor: '#3c40c6' }}>Authorize Shop Partner</button>
          </form>
        )}
      </div>
    </div>
  );
}

const inputStyle = { width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '8px', boxSizing: 'border-box' };
const btnStyle = { width: '100%', padding: '15px', backgroundColor: '#05c46b', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' };

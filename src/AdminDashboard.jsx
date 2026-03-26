import React, { useState } from 'react';

export default function AdminDashboard({ onExit }) {
  const [activeTab, setActiveTab] = useState("products");
  const [msg, setMsg] = useState("");

  const [prodForm, setProdForm] = useState({ name: "", brand: "", category: "Snacks", mrp: "", qnty: "", emoji: "📦", searchTags: "" });
  
  // 👇 Added 'password' to the shop form state
  const [shopForm, setShopForm] = useState({ name: "", pincode: "", phone: "", password: "" });

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
        setMsg("✅ Product Added!");
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
        setMsg(`✅ Shop "${shopForm.name}" Authorized!`);
        setShopForm({ name: "", pincode: "", phone: "", password: "" });
      }
    } catch (err) { setMsg("❌ Error: Use a unique phone number."); }
  };

  return (
    <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ backgroundColor: '#1e272e', color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>🚩 Super Admin</h2>
        <button onClick={onExit} style={{ backgroundColor: '#ff3f34', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px' }}>Logout</button>
      </div>

      <div style={{ display: 'flex', backgroundColor: 'white' }}>
        <button onClick={() => setActiveTab("products")} style={{ flex: 1, padding: '15px', border: 'none', background: activeTab === "products" ? '#fff' : '#f9f9f9', borderBottom: activeTab === "products" ? '3px solid #05c46b' : 'none' }}>📦 Products</button>
        <button onClick={() => setActiveTab("shops")} style={{ flex: 1, padding: '15px', border: 'none', background: activeTab === "shops" ? '#fff' : '#f9f9f9', borderBottom: activeTab === "shops" ? '3px solid #3c40c6' : 'none' }}>🏪 Shops</button>
      </div>

      {msg && <div style={{ margin: '15px', padding: '10px', backgroundColor: '#dff9fb', textAlign: 'center' }}>{msg}</div>}

      <div style={{ padding: '20px' }}>
        {activeTab === "products" ? (
          <form onSubmit={handleAddProduct} style={cardStyle}>
            <h3>Add Global Product</h3>
            <input placeholder="Name" value={prodForm.name} onChange={e => setProdForm({...prodForm, name: e.target.value})} style={inputStyle} required />
            <input placeholder="MRP" type="number" value={prodForm.mrp} onChange={e => setProdForm({...prodForm, mrp: e.target.value})} style={inputStyle} required />
            <button type="submit" style={btnStyle}>Add Product</button>
          </form>
        ) : (
          <form onSubmit={handleAddShop} style={cardStyle}>
            <h3>Authorize Shop Partner</h3>
            <input placeholder="Shop Name" value={shopForm.name} onChange={e => setShopForm({...shopForm, name: e.target.value})} style={inputStyle} required />
            <input placeholder="Pincode" value={shopForm.pincode} onChange={e => setShopForm({...shopForm, pincode: e.target.value})} style={inputStyle} required />
            <input placeholder="Mobile Number" value={shopForm.phone} onChange={e => setShopForm({...shopForm, phone: e.target.value})} style={inputStyle} required />
            
            {/* 🆕 THE NEW PASSWORD FIELD */}
            <input 
              placeholder="Set Login Password" 
              type="text" 
              value={shopForm.password} 
              onChange={e => setShopForm({...shopForm, password: e.target.value})} 
              style={inputStyle} 
              required 
            />
            
            <button type="submit" style={{ ...btnStyle, backgroundColor: '#3c40c6' }}>Authorize & Create Password</button>
          </form>
        )}
      </div>
    </div>
  );
}

const cardStyle = { backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' };
const inputStyle = { width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '8px', boxSizing: 'border-box' };
const btnStyle = { width: '100%', padding: '15px', backgroundColor: '#05c46b', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };

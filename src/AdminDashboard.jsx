import React, { useState, useEffect } from 'react';

export default function AdminDashboard({ onExit }) {
  const [activeTab, setActiveTab] = useState("products"); 
  
  // Database States
  const [products, setProducts] = useState([]);
  const [shops, setShops] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Drawer & Form States
  const [selectedShop, setSelectedShop] = useState(null);
  const [shopAnalysis, setShopAnalysis] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  
  // Forms
  const [form, setForm] = useState({ name: "", brand: "", category: "", mrp: "", qnty: "", emoji: "", image: "", searchTags: "" });
  // 👇 NEW: State for adding a shop
  const [shopForm, setShopForm] = useState({ name: "", pincode: "", phone: "", password: "" });

  const BASE_URL = "https://darkslategrey-snail-415133.hostingersite.com";

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "products") {
        const res = await fetch(`${BASE_URL}/master-products`);
        setProducts(await res.json());
      } else if (activeTab === "shops") {
        const res = await fetch(`${BASE_URL}/shops`);
        setShops(await res.json());
      } else if (activeTab === "users") {
        const res = await fetch(`${BASE_URL}/users`);
        setUsers(await res.json());
      } else if (activeTab === "orders") {
        const res = await fetch(`${BASE_URL}/orders`);
        setOrders(await res.json());
      }
    } catch (err) { console.log(err); }
    setLoading(false);
  };

  // --- ACTIONS ---
  const handleAddProduct = async (e) => {
    e.preventDefault();
    await fetch(`${BASE_URL}/master-products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    setForm({ name: "", brand: "", category: "", mrp: "", qnty: "", emoji: "", image: "", searchTags: "" });
    fetchData();
    alert("✅ Added to Master Catalog!");
  };

  // 👇 NEW: Action to create a new shop
  const handleAddShop = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BASE_URL}/shops`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shopForm)
      });
      if (res.ok) {
        setShopForm({ name: "", pincode: "", phone: "", password: "" });
        fetchData();
        alert("✅ Shop Partner Successfully Registered!");
      } else {
        const data = await res.json();
        alert("❌ " + data.error);
      }
    } catch (err) { console.log(err); }
  };

  const openShopDrawer = async (shop) => {
    setSelectedShop(shop);
    setLoadingAnalysis(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/shop-analysis/${shop._id}`);
      setShopAnalysis(await res.json());
    } catch (err) { console.log("Error fetching analysis", err); }
    setLoadingAnalysis(false);
  };

  const handleEditUserCoins = async (userId, currentCoins) => {
    const newCoins = prompt(`Adjust coins for user (Current: ${currentCoins}):`, currentCoins);
    if (newCoins && !isNaN(newCoins)) {
      await fetch(`${BASE_URL}/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coins: Number(newCoins) })
      });
      fetchData();
    }
  };

  return (
    <div style={{ backgroundColor: '#f1f5f9', minHeight: '100vh', fontFamily: 'sans-serif', paddingBottom: '50px' }}>
      
      {/* 🧭 TOP NAV BAR */}
      <nav style={{ backgroundColor: '#0f172a', color: 'white', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
          <h2 style={{ margin: 0, color: '#10b981', fontSize: '1.4rem' }}>PackItOut ADMIN</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setActiveTab("products")} style={tabButtonStyle(activeTab === "products")}>📦 Master Catalog</button>
            <button onClick={() => setActiveTab("shops")} style={tabButtonStyle(activeTab === "shops")}>🏪 Shop Partners</button>
            <button onClick={() => setActiveTab("users")} style={tabButtonStyle(activeTab === "users")}>👤 Users DB</button>
            <button onClick={() => setActiveTab("orders")} style={tabButtonStyle(activeTab === "orders")}>📜 Global Orders</button>
          </div>
        </div>
        <button onClick={onExit} style={{ backgroundColor: '#ef4444', border: 'none', padding: '8px 15px', borderRadius: '6px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Logout</button>
      </nav>

      <div style={{ padding: '30px' }}>

        {/* --- TAB 1: MASTER CATALOG --- */}
        {activeTab === "products" && (
           <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '30px' }}>
             <div style={cardStyle}>
               <h3 style={{ marginTop: 0 }}>Add Master Product</h3>
               <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                 <input type="text" placeholder="Product Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={inputStyle} required />
                 <input type="text" placeholder="Brand Name" value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} style={inputStyle} required />
                 <input type="text" placeholder="Category" value={form.category} onChange={e => setForm({...form, category: e.target.value})} style={inputStyle} required />
                 <div style={{ display: 'flex', gap: '10px' }}>
                   <input type="number" placeholder="MRP" value={form.mrp} onChange={e => setForm({...form, mrp: e.target.value})} style={inputStyle} required />
                   <input type="text" placeholder="Qty" value={form.qnty} onChange={e => setForm({...form, qnty: e.target.value})} style={inputStyle} required />
                 </div>
                 <input type="text" placeholder="Image URL (Real Photo)" value={form.image} onChange={e => setForm({...form, image: e.target.value})} style={inputStyle} />
                 <input type="text" placeholder="Emoji (Backup)" value={form.emoji} onChange={e => setForm({...form, emoji: e.target.value})} style={inputStyle} />
                 <button type="submit" style={submitBtnStyle}>Add to Database</button>
               </form>
             </div>
 
             <div style={cardStyle}>
               <h3 style={{ marginTop: 0 }}>Master List ({products.length})</h3>
               <table style={tableStyle}>
                 <thead>
                   <tr style={tableHeaderStyle}>
                     <th>Preview</th><th>Product Details</th><th>Price</th><th>Actions</th>
                   </tr>
                 </thead>
                 <tbody>
                   {products.map(p => (
                     <tr key={p._id} style={{ borderBottom: '1px solid #f8fafc' }}>
                       <td style={{ padding: '10px' }}>{p.image ? <img src={p.image} style={{ width: '40px', height: '40px', objectFit: 'contain' }} alt={p.name} /> : <span style={{fontSize: '24px'}}>{p.emoji}</span>}</td>
                       <td style={{ padding: '10px' }}><strong>{p.name}</strong><br/><span style={{ fontSize: '0.8rem', color: '#64748b' }}>{p.brand} | {p.category}</span></td>
                       <td style={{ padding: '10px' }}>₹{p.mrp}</td>
                       <td style={{ padding: '10px' }}>
                         <button style={actionBtnStyle('#3b82f6')}>✏️ Edit</button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </div>
        )}

        {/* --- TAB 2: SHOP PARTNERS (NOW WITH ADD SHOP FORM!) --- */}
        {activeTab === "shops" && (
          <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '30px' }}>
            
            {/* 🆕 ADD SHOP FORM */}
            <div style={cardStyle}>
               <h3 style={{ marginTop: 0 }}>Register New Shop</h3>
               <form onSubmit={handleAddShop} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                 <input type="text" placeholder="Shop Name (e.g., Sharma Kirana)" value={shopForm.name} onChange={e => setShopForm({...shopForm, name: e.target.value})} style={inputStyle} required />
                 <input type="text" placeholder="Pincode (e.g., 400001)" value={shopForm.pincode} onChange={e => setShopForm({...shopForm, pincode: e.target.value})} style={inputStyle} required />
                 <input type="text" placeholder="Phone Number (Login ID)" value={shopForm.phone} onChange={e => setShopForm({...shopForm, phone: e.target.value})} style={inputStyle} required />
                 <input type="text" placeholder="Password" value={shopForm.password} onChange={e => setShopForm({...shopForm, password: e.target.value})} style={inputStyle} required />
                 <button type="submit" style={submitBtnStyle}>Register Partner</button>
               </form>
             </div>

            {/* SHOP LIST GRID */}
            <div style={cardStyle}>
              <h3 style={{ marginTop: 0 }}>Registered Shops ({shops.length})</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                                                         

import React, { useState, useEffect } from 'react';

export default function AdminDashboard({ onExit }) {
  const [activeTab, setActiveTab] = useState("products"); // products, shops, users, orders
  
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
  const [form, setForm] = useState({ name: "", brand: "", category: "", mrp: "", qnty: "", emoji: "", image: "", searchTags: "" });

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

        {/* --- TAB 1: MASTER CATALOG (Add & View/Edit) --- */}
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
                 <button type="submit" style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>Add to Database</button>
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

        {/* --- TAB 2: SHOP PARTNERS (View List & Slide-out) --- */}
        {activeTab === "shops" && (
          <div style={cardStyle}>
            <h3>Registered Shops ({shops.length})</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {shops.map(shop => (
                <div key={shop._id} style={{ border: '1px solid #e2e8f0', padding: '20px', borderRadius: '12px', backgroundColor: '#f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <h4 style={{ margin: '0 0 5px 0', color: '#0f172a' }}>{shop.name}</h4>
                    <span style={{ fontSize: '0.8rem', padding: '3px 8px', borderRadius: '12px', background: shop.isOpen ? '#d1fae5' : '#fee2e2', color: shop.isOpen ? '#059669' : '#b91c1c' }}>{shop.isOpen ? '🟢 Open' : '🔴 Closed'}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', marginBottom: '15px' }}>📍 {shop.pincode} | 📞 {shop.phone}</p>
                  
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => openShopDrawer(shop)} style={{ flex: 1, padding: '10px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>👁️ View Details & Gaps</button>
                    <button style={{ padding: '10px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer' }}>✏️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- TAB 3: USERS DB (View List & Edit Coins) --- */}
        {activeTab === "users" && (
          <div style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Customer Database ({users.length})</h3>
            <table style={tableStyle}>
              <thead>
                <tr style={tableHeaderStyle}>
                  <th>User Info</th><th>Contact</th><th>Pincode</th><th>🪙 Coins</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '10px' }}><strong>{u.name || "Guest"}</strong><br/><span style={{ fontSize: '0.8rem', color: '#64748b' }}>Ref: {u.referralCode || 'N/A'}</span></td>
                    <td style={{ padding: '10px' }}>{u.phone}</td>
                    <td style={{ padding: '10px' }}>{u.pincode || "Not Set"}</td>
                    <td style={{ padding: '10px', fontWeight: 'bold', color: '#f59e0b' }}>{u.coins}</td>
                    <td style={{ padding: '10px', display: 'flex', gap: '10px' }}>
                      <button onClick={() => handleEditUserCoins(u._id, u.coins)} style={actionBtnStyle('#10b981')}>🪙 Edit Coins</button>
                      <button style={actionBtnStyle('#3b82f6')}>👁️ View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* --- TAB 4: GLOBAL ORDERS (View List) --- */}
        {activeTab === "orders" && (
          <div style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Global Order Pulse ({orders.length})</h3>
            <table style={tableStyle}>
              <thead>
                <tr style={tableHeaderStyle}>
                  <th>Order ID</th><th>Customer</th><th>Shop</th><th>Amount</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o._id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '10px', fontSize: '0.9rem', color: '#64748b' }}>...{o._id.slice(-6)}</td>
                    <td style={{ padding: '10px' }}><strong>{o.userId?.name || "Unknown"}</strong></td>
                    <td style={{ padding: '10px' }}>{o.shopId?.name || "Unknown"}</td>
                    <td style={{ padding: '10px', fontWeight: 'bold' }}>₹{o.totalAmount}</td>
                    <td style={{ padding: '10px' }}><span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', backgroundColor: o.status === 'Delivered ✅' ? '#d1fae5' : '#fef3c7', color: o.status === 'Delivered ✅' ? '#059669' : '#b45309' }}>{o.status}</span></td>
                    <td style={{ padding: '10px' }}><button style={actionBtnStyle('#0f172a')}>👁️ View Items</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* ⬛ DRAWER OVERLAY */}
      {selectedShop && (
        <div onClick={() => setSelectedShop(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 }} />
      )}

      {/* 📲 GAP ANALYSIS DRAWER */}
      <div style={{
        position: 'fixed', top: 0, right: selectedShop ? 0 : '-450px', width: '400px', height: '100vh', 
        backgroundColor: 'white', zIndex: 1001, boxShadow: '-5px 0 20px rgba(0,0,0,0.1)', 
        transition: 'right 0.3s ease-in-out', display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ padding: '20px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, color: '#0f172a' }}>{selectedShop?.name}</h3>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Inventory Intelligence</span>
          </div>
          <button onClick={() => setSelectedShop(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>❌</button>
        </div>

        <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
          {loadingAnalysis ? <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: '50px' }}>Loading analysis...</p> : shopAnalysis ? (
            <>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
                <div style={{ flex: 1, backgroundColor: '#ecfdf5', padding: '15px', borderRadius: '10px', border: '1px solid #a7f3d0', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>{shopAnalysis.activeCount}</div>
                  <div style={{ fontSize: '0.7rem', color: '#059669', textTransform: 'uppercase', fontWeight: 'bold' }}>Active Items</div>
                </div>
                <div style={{ flex: 1, backgroundColor: '#fef2f2', padding: '15px', borderRadius: '10px', border: '1px solid #fecaca', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>{shopAnalysis.missingCount}</div>
                  <div style={{ fontSize: '0.7rem', color: '#b91c1c', textTransform: 'uppercase', fontWeight: 'bold' }}>Missing Items</div>
                </div>
              </div>

              <h4 style={{ color: '#0f172a', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>❌ Missing Revenue Opportunities</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
                {shopAnalysis.missingItems.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#f1f5f9', borderRadius: '8px', color: '#64748b' }}>Perfect! This shop has every master item in stock. 🌟</div>
                ) : (
                  shopAnalysis.missingItems.map(item => (
                    <div key={item._id} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                       {item.image ? <img src={item.image} style={{ width: '40px', height: '40px', objectFit: 'contain' }} alt={item.name} /> : <span style={{fontSize: '24px'}}>{item.emoji}</span>}
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#334155' }}>{item.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{item.brand} • {item.category}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : <p>No data available.</p>}
        </div>
      </div>
    </div>
  );
}

// Styling Helpers
const tabButtonStyle = (isActive) => ({ backgroundColor: isActive ? '#10b981' : 'transparent', color: isActive ? 'white' : '#94a3b8', border: 'none', padding: '8px 15px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' });
const cardStyle = { backgroundColor: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box' };
const tableStyle = { width: '100%', borderCollapse: 'collapse', textAlign: 'left' };
const tableHeaderStyle = { borderBottom: '2px solid #f1f5f9', color: '#64748b', paddingBottom: '10px' };
const actionBtnStyle = (color) => ({ background: 'none', border: `1px solid ${color}`, color: color, padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' });
                            

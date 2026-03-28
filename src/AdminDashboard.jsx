import React, { useState, useEffect } from 'react';

// 🔗 IMPORTING YOUR ADMIN WORKERS
import ProductsTab from './components/AdminDashboard/ProductsTab';
import ShopsTab from './components/AdminDashboard/ShopsTab';
import UsersTab from './components/AdminDashboard/UsersTab';
import GlobalOrdersTab from './components/AdminDashboard/GlobalOrdersTab';
import AdminParchiManager from './components/AdminDashboard/AdminParchiManager'; // 🧾 NEW WORKER!

export default function AdminDashboard({ onExit }) {
  const [activeTab, setActiveTab] = useState("products"); 
  
  // Database States
  const [products, setProducts] = useState([]);
  const [shops, setShops] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [globalParchis, setGlobalParchis] = useState([]); // 📸 NEW STATE
  const [loading, setLoading] = useState(true);

  // Drawer & Analysis States
  const [selectedShop, setSelectedShop] = useState(null);
  const [shopAnalysis, setShopAnalysis] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  
  // Forms
  const [form, setForm] = useState({ name: "", brand: "", category: "", mrp: "", qnty: "", emoji: "", image: "", searchTags: "" });
  const [shopForm, setShopForm] = useState({ name: "", pincode: "", phone: "", password: "" });
  const [userForm, setUserForm] = useState({ name: "", phone: "", password: "", pincode: "" });

  const BASE_URL = "https://darkslategrey-snail-415133.hostingersite.com";

  const CATEGORIES = [
    "Dairy, Bread & Eggs", "Fruits & Veg", "Atta, Rice & Dal", "Chicken, Meat & Fish", 
    "Oil, Ghee & Masala", "Dry Fruits & Cereals", "Bakery & Biscuits", "Kitchen Appliances",
    "Chips & Namkeen", "Drinks & Juices", "Sweets & Chocolates", "Ice Creams",
    "Tea & Coffee", "Instant Food", "Sauces & Spreads", "Paan Corner",
    "Bath & Body", "Cleaners & Repellents", "Hair Care", "Health & Pharma"
  ];

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
      } else if (activeTab === "parchis") {
        // 📸 FETCH GLOBAL PARCHIS
        const res = await fetch(`${BASE_URL}/admin/all-parchis`);
        setGlobalParchis(await res.json());
      }
    } catch (err) { console.log(err); }
    setLoading(false);
  };

  // --- 🚀 ADMIN OVERRIDE LOGIC ---
  const handleAdminProcessOrder = async (parchi, billItems) => {
    const totalAmount = billItems.reduce((sum, i) => sum + (i.price * i.qty), 0);
    
    try {
      const res = await fetch(`${BASE_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: parchi.userId,
          shopId: parchi.shopId,
          items: billItems,
          totalAmount: totalAmount,
          status: "Pending",
          imageUrl: parchi.imageUrl // This photo link ensures the Parchi is marked 'processed' on backend
        })
      });

      if (res.ok) {
        alert("✅ Order processed successfully as Admin!");
        fetchData(); // Refresh the list
      } else {
        alert("❌ Failed to process order.");
      }
    } catch (err) {
      console.log(err);
      alert("❌ Error connecting to server.");
    }
  };

  // --- EXISTING LOGIC FUNCTIONS ---
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

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userForm)
      });
      if (res.ok) {
        setUserForm({ name: "", phone: "", password: "", pincode: "" });
        fetchData();
        alert("✅ User Successfully Registered!");
      } else {
        const data = await res.json();
        alert("❌ " + data.error);
      }
    } catch (err) { console.log(err); }
  };

  const handleEditShop = async (shop) => {
    const newName = prompt("Edit Shop Name:", shop.name);
    if (!newName) return;
    await fetch(`${BASE_URL}/shops/${shop._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, pincode: prompt("Pincode:", shop.pincode), phone: prompt("Phone:", shop.phone) })
    });
    fetchData();
  };

  const handleEditUser = async (user) => {
    const newName = prompt("Edit User Name:", user.name);
    if (!newName) return;
    await fetch(`${BASE_URL}/users/${user._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, phone: prompt("Phone:", user.phone), pincode: prompt("Pincode:", user.pincode) })
    });
    fetchData();
  };

  const handleEditUserCoins = async (userId, currentCoins) => {
    const newCoins = prompt(`Adjust coins (Current: ${currentCoins}):`, currentCoins);
    if (newCoins && !isNaN(newCoins)) {
      await fetch(`${BASE_URL}/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coins: Number(newCoins) })
      });
      fetchData();
    }
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

  return (
    <div style={{ backgroundColor: '#f1f5f9', minHeight: '100vh', fontFamily: 'sans-serif', paddingBottom: '50px' }}>
      
      {/* 🚀 ADMIN NAV BAR */}
      <nav style={{ backgroundColor: '#0f172a', color: 'white', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <h2 style={{ margin: 0, color: '#10b981', fontSize: '1.4rem' }}>PackItOut ADMIN</h2>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
            <button onClick={() => setActiveTab("products")} style={tabButtonStyle(activeTab === "products")}>📦 Catalog</button>
            <button onClick={() => setActiveTab("shops")} style={tabButtonStyle(activeTab === "shops")}>🏪 Shops</button>
            <button onClick={() => setActiveTab("users")} style={tabButtonStyle(activeTab === "users")}>👤 Users</button>
            <button onClick={() => setActiveTab("orders")} style={tabButtonStyle(activeTab === "orders")}>📜 Orders</button>
            <button onClick={() => setActiveTab("parchis")} style={tabButtonStyle(activeTab === "parchis")}>🧾 Global Parchis</button>
          </div>
        </div>
        <button onClick={onExit} style={{ backgroundColor: '#ef4444', border: 'none', padding: '8px 15px', borderRadius: '6px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Logout</button>
      </nav>

      <div style={{ padding: '30px' }}>
        
        {loading ? (
          <div style={{ textAlign: 'center', marginTop: '50px', color: '#64748b' }}>Loading Data...</div>
        ) : (
          <>
            {activeTab === "products" && (
               <ProductsTab 
                 products={products} form={form} setForm={setForm} 
                 handleAddProduct={handleAddProduct} CATEGORIES={CATEGORIES} 
               />
            )}

            {activeTab === "shops" && (
              <ShopsTab 
                shops={shops} shopForm={shopForm} setShopForm={setShopForm} 
                handleAddShop={handleAddShop} handleEditShop={handleEditShop} 
                openShopDrawer={openShopDrawer} selectedShop={selectedShop} 
                setSelectedShop={setSelectedShop} shopAnalysis={shopAnalysis} 
                loadingAnalysis={loadingAnalysis} 
              />
            )}

            {activeTab === "users" && (
              <UsersTab 
                users={users} userForm={userForm} setUserForm={setUserForm} 
                handleAddUser={handleAddUser} handleEditUser={handleEditUser} 
                handleEditUserCoins={handleEditUserCoins} 
              />
            )}

            {activeTab === "orders" && (
              <GlobalOrdersTab orders={orders} />
            )}

            {activeTab === "parchis" && (
              <AdminParchiManager 
                parchis={globalParchis} 
                shops={shops} 
                onProcessOrder={handleAdminProcessOrder} 
              />
            )}
          </>
        )}

      </div>
    </div>
  );
}

const tabButtonStyle = (isActive) => ({
  backgroundColor: isActive ? '#334155' : 'transparent',
  color: isActive ? '#10b981' : '#94a3b8',
  border: 'none', padding: '8px 15px', borderRadius: '6px',
  fontWeight: 'bold', cursor: 'pointer', transition: '0.2s', whiteSpace: 'nowrap'
});
             

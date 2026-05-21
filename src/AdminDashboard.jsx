import React, { useState, useEffect } from 'react';
import { useToast } from './ui/DialogProvider.jsx';
import { adminFetch, clearAdminToken } from './utils/api.js';
import ProductsTab from './components/AdminDashboard/ProductsTab';
import ShopsTab from './components/AdminDashboard/ShopsTab';
import UsersTab from './components/AdminDashboard/UsersTab';
import GlobalOrdersTab from './components/AdminDashboard/GlobalOrdersTab';
import LiveOpsTab from './components/AdminDashboard/LiveOpsTab';
import AdminParchiManager from './components/AdminDashboard/AdminParchiManager'; // 🌟 Your Master POS!
import ComplaintsTab from './components/AdminDashboard/ComplaintsTab';
import MissedSearchesTab from './components/AdminDashboard/MissedSearchesTab';
import BrandRankingTab from './components/AdminDashboard/BrandRankingTab';

export default function AdminDashboard({ onExit }) {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("shops");
  
  const [products, setProducts] = useState([]);
  const [shops, setShops] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [globalParchis, setGlobalParchis] = useState([]); 
  const [loading, setLoading] = useState(true);

  const initialProductForm = { 
    name: "", brand: "", category: "", mrp: "", qnty: "", emoji: "", image: "", searchTags: "", 
    description: "", manufacturer: "", energy: "", protein: "", carbs: "", sugar: "", fat: "",
    itemGroupId: "", relatedProducts: [], substitutes: [] 
  };
  const [form, setForm] = useState(initialProductForm);
  const [editingProductId, setEditingProductId] = useState(null); 
  
  const initialShopForm = { 
    name: "", phone: "", password: "", pincode: "",
    ownerName: "", fullAddress: "", operatingHours: "", shopImage: "",
    fssai: "", gst: "", panNumber: "", inventoryMode: "manual"
  };
  const [shopForm, setShopForm] = useState(initialShopForm);
  const [editingShopId, setEditingShopId] = useState(null);

  const [userForm, setUserForm] = useState({ name: "", phone: "", password: "", pincode: "" });

  const BASE_URL = (import.meta.env.VITE_API_BASE || "https://darkslategrey-snail-415133.hostingersite.com");
  const CATEGORIES = ["Dairy, Bread & Eggs", "Fruits & Veg", "Atta, Rice & Dal", "Chips & Namkeen", "Drinks & Juices", "Sweets & Chocolates", "Ice Creams", "Instant Food", "Bath & Body", "Health & Pharma"];

  useEffect(() => {
    let cancelled = false;
    fetchData(cancelled);
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Keep the global orders board live so the stalled-order alarm in
  // GlobalOrdersTab actually sees new orders without the admin re-clicking the tab.
  useEffect(() => {
    if (activeTab !== "orders") return;
    const poll = setInterval(async () => {
      try {
        const res = await adminFetch(`/orders`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setOrders(data);
        }
      } catch (err) { /* swallow — next tick will retry */ }
    }, 15000);
    return () => clearInterval(poll);
  }, [activeTab]);

  // Defensive: every list endpoint now returns an array on success. If the
  // server returns an error object (or anything non-array), default to [].
  // Old behaviour was to store the error object as state, then crash on .map().
  const safeArray = async (res) => {
    if (!res || !res.ok) return [];
    try {
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch { return []; }
  };

  const fetchData = async (cancelled = false) => {
    setLoading(true);
    try {
      let result = null;
      if (activeTab === "products") {
        result = await safeArray(await fetch(`${BASE_URL}/master-products`));
        if (!cancelled) setProducts(result);
      } else if (activeTab === "shops") {
        // GET /shops is admin-gated (used to leak phone/upi/fssai/gst/pan to
        // every unauthenticated visitor). Send the admin token.
        result = await safeArray(await adminFetch(`/shops`));
        if (!cancelled) setShops(result);
      } else if (activeTab === "users") {
        result = await safeArray(await adminFetch(`/users`));
        if (!cancelled) setUsers(result);
      } else if (activeTab === "orders") {
        result = await safeArray(await adminFetch(`/orders`));
        if (!cancelled) setOrders(result);
      } else if (activeTab === "parchis") {
        result = await safeArray(await adminFetch(`/admin/all-parchis`));
        if (!cancelled) setGlobalParchis(result);
      }
    } catch (err) { console.log(err); }
    if (!cancelled) setLoading(false);
  };

  const handleLogout = () => {
    clearAdminToken();
    if (onExit) onExit();
  };

  // --- UPGRADED PRODUCT LOGIC --- 
  const handleProductSubmit = async (e) => {
    e.preventDefault(); 

    try {
      // searchTags is a comma-separated string in the form but the backend
      // expects an array — normalise here so /master-products/* stores the
      // tags as a proper array (the tag-based search in SearchPage was
      // silently returning no matches because of this).
      const payload = {
        ...form,
        searchTags: typeof form.searchTags === 'string'
          ? form.searchTags.split(',').map(s => s.trim()).filter(Boolean)
          : (Array.isArray(form.searchTags) ? form.searchTags : []),
      };
      if (editingProductId) {
        const res = await adminFetch(`/master-products/${editingProductId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        if (res.ok) toast("Product updated!");
      } else {
        const res = await adminFetch(`/master-products`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        if (res.ok) toast("New product added to master catalog!");
      }

      setForm(initialProductForm);
      setEditingProductId(null);
      fetchData();
    } catch (err) {
      console.error(err);
      toast("Failed to save product. Check your connection.", 'error');
    }
  };

  const startEditingProduct = (product) => {
    setForm({
      name: product.name || "",
      brand: product.brand || "",
      category: product.category || "",
      mrp: product.mrp || "",
      qnty: product.qnty || "",
      emoji: product.emoji || "",
      image: product.image || "",
      searchTags: product.searchTags || "",
      description: product.description || "",
      manufacturer: product.manufacturer || "",
      energy: product.energy || "",
      protein: product.protein || "",
      carbs: product.carbs || "",
      sugar: product.sugar || "",
      fat: product.fat || "",
      itemGroupId: product.itemGroupId || "",
      relatedProducts: product.relatedProducts || [],
      substitutes: product.substitutes || []
    });
    setEditingProductId(product._id);
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  const cancelEditProduct = () => { 
    setForm(initialProductForm); 
    setEditingProductId(null); 
  };

  // --- SHOP LOGIC ---
  const handleShopSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingShopId) {
        await adminFetch(`/shops/${editingShopId}/admin-edit`, {
          method: "PATCH", body: JSON.stringify(shopForm),
        });
        toast("Shop updated!");
      } else {
        await adminFetch(`/shops`, {
          method: "POST", body: JSON.stringify(shopForm),
        });
        toast("Shop partner registered!");
      }
      setShopForm(initialShopForm);
      setEditingShopId(null);
      fetchData();
    } catch (err) { toast("Something went wrong.", 'error'); }
  };

  const startEditingShop = (shop) => {
    setShopForm({
      name: shop.name || "", phone: shop.phone || "", password: shop.password || "", pincode: shop.pincode || "",
      ownerName: shop.ownerName || "", fullAddress: shop.fullAddress || "", operatingHours: shop.operatingHours || "", 
      shopImage: shop.shopImage || "", fssai: shop.fssai || "", gst: shop.gst || "", panNumber: shop.panNumber || "", 
      inventoryMode: shop.inventoryMode || "manual"
    });
    setEditingShopId(shop._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditShop = () => { setShopForm(initialShopForm); setEditingShopId(null); };

  return (
    <div style={{ backgroundColor: '#f1f5f9', minHeight: '100vh', fontFamily: 'sans-serif', paddingBottom: '50px' }}>
      <nav style={{ backgroundColor: '#0f172a', color: 'white', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
        <h2 style={{ margin: 0, color: '#10b981', fontSize: '1.4rem' }}>PackItOut ADMIN</h2>
        
        {/* 🌟 NEW: Added the Orders and Master POS buttons to the navbar! */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '5px' }} className="hide-scroll">
          <style>{`.hide-scroll::-webkit-scrollbar { display: none; }`}</style>
          
          <button onClick={() => setActiveTab("products")} style={tabButtonStyle(activeTab === "products")}>📦 Catalog</button>
          <button onClick={() => setActiveTab("shops")} style={tabButtonStyle(activeTab === "shops")}>🏪 Shops</button>
          <button onClick={() => setActiveTab("users")} style={tabButtonStyle(activeTab === "users")}>👤 Users</button>
          <button onClick={() => setActiveTab("orders")} style={tabButtonStyle(activeTab === "orders")}>🛒 Orders</button>
          <button onClick={() => setActiveTab("liveops")} style={tabButtonStyle(activeTab === "liveops")}>🛡️ Live Ops</button>
          <button onClick={() => setActiveTab("parchis")} style={tabButtonStyle(activeTab === "parchis")}>🧾 Master POS</button>
          <button onClick={() => setActiveTab("complaints")} style={tabButtonStyle(activeTab === "complaints")}>📣 Complaints</button>
          <button onClick={() => setActiveTab("missed")} style={tabButtonStyle(activeTab === "missed")}>🔎 Missed Searches</button>
          <button onClick={() => setActiveTab("ranking")} style={tabButtonStyle(activeTab === "ranking")}>🎯 Ranking</button>
        </div>
      </nav>

      <div style={{ padding: '30px' }}>
        {loading ? <div style={{ textAlign: 'center', marginTop: '50px', color: '#64748b' }}>Loading data...</div> : (
          <>
            {/* 🔀 ROUTING: This tells React which component to show based on the active tab */}
            {activeTab === "products" && <ProductsTab products={products} form={form} setForm={setForm} handleProductSubmit={handleProductSubmit} CATEGORIES={CATEGORIES} editingProductId={editingProductId} startEditingProduct={startEditingProduct} cancelEdit={cancelEditProduct} onProductsChanged={fetchData} />}

            {activeTab === "shops" && <ShopsTab shops={shops} shopForm={shopForm} setShopForm={setShopForm} handleShopSubmit={handleShopSubmit} editingShopId={editingShopId} startEditingShop={startEditingShop} cancelEditShop={cancelEditShop} />}

            {activeTab === "users" && <UsersTab users={users} onUsersChanged={fetchData} />}
            
            {/* 🌟 NEW: Render the Orders and Master POS components */}
            {activeTab === "orders" && <GlobalOrdersTab orders={orders} />}

            {activeTab === "liveops" && <LiveOpsTab />}
            
            {activeTab === "parchis" && <AdminParchiManager />}

            {activeTab === "complaints" && <ComplaintsTab />}

            {activeTab === "missed" && <MissedSearchesTab />}

            {activeTab === "ranking" && <BrandRankingTab />}
          </>
        )}
      </div>
    </div>
  );
}

const tabButtonStyle = (isActive) => ({ 
  backgroundColor: isActive ? '#334155' : 'transparent', 
  color: isActive ? '#10b981' : '#94a3b8', 
  border: 'none', 
  padding: '8px 15px', 
  borderRadius: '6px', 
  fontWeight: 'bold', 
  cursor: 'pointer',
  whiteSpace: 'nowrap' // Prevents buttons from squishing on small screens
});

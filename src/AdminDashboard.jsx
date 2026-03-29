import React, { useState, useEffect } from 'react';
import ProductsTab from './components/AdminDashboard/ProductsTab';
import ShopsTab from './components/AdminDashboard/ShopsTab';
import UsersTab from './components/AdminDashboard/UsersTab';
import GlobalOrdersTab from './components/AdminDashboard/GlobalOrdersTab';
import AdminParchiManager from './components/AdminDashboard/AdminParchiManager'; 

export default function AdminDashboard({ onExit }) {
  const [activeTab, setActiveTab] = useState("shops"); // Defaulting to shops to test it!
  
  const [products, setProducts] = useState([]);
  const [shops, setShops] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [globalParchis, setGlobalParchis] = useState([]); 
  const [loading, setLoading] = useState(true);

  // Forms
  const initialProductForm = { name: "", brand: "", category: "", mrp: "", qnty: "", emoji: "", image: "", searchTags: "", description: "", manufacturer: "", energy: "", protein: "", carbs: "", sugar: "", fat: "" };
  const [form, setForm] = useState(initialProductForm);
  const [editingProductId, setEditingProductId] = useState(null); 
  
  // Shop Form State
  const initialShopForm = { 
    name: "", phone: "", password: "", pincode: "",
    ownerName: "", fullAddress: "", operatingHours: "", shopImage: "",
    fssai: "", gst: "", panNumber: "", inventoryMode: "manual"
  };
  const [shopForm, setShopForm] = useState(initialShopForm);
  const [editingShopId, setEditingShopId] = useState(null);

  const [userForm, setUserForm] = useState({ name: "", phone: "", password: "", pincode: "" });

  const BASE_URL = "https://darkslategrey-snail-415133.hostingersite.com";
  const CATEGORIES = ["Dairy, Bread & Eggs", "Fruits & Veg", "Atta, Rice & Dal", "Chips & Namkeen", "Drinks & Juices", "Sweets & Chocolates", "Ice Creams", "Instant Food", "Bath & Body", "Health & Pharma"];

  useEffect(() => { fetchData(); }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "products") setProducts(await (await fetch(`${BASE_URL}/master-products`)).json());
      else if (activeTab === "shops") setShops(await (await fetch(`${BASE_URL}/shops`)).json());
      else if (activeTab === "users") setUsers(await (await fetch(`${BASE_URL}/users`)).json());
      else if (activeTab === "orders") setOrders(await (await fetch(`${BASE_URL}/orders`)).json());
      else if (activeTab === "parchis") setGlobalParchis(await (await fetch(`${BASE_URL}/admin/all-parchis`)).json());
    } catch (err) { console.log(err); }
    setLoading(false);
  };

  // 👇 --- UPGRADED PRODUCT LOGIC --- 👇
  const handleProductSubmit = async (e) => {
    e.preventDefault(); // 🛑 Stops the page from refreshing!

    try {
      if (editingProductId) {
        // Edit Existing Product
        const res = await fetch(`${BASE_URL}/master-products/${editingProductId}`, {
          method: "PATCH", 
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form)
        });
        if (res.ok) alert("✅ Product Updated Successfully!");
      } else {
        // Add New Product
        const res = await fetch(`${BASE_URL}/master-products`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form)
        });
        if (res.ok) alert("✅ New Product Added to Master Catalog!");
      }

      setForm(initialProductForm);
      setEditingProductId(null);
      fetchData(); // Refresh the list instantly
    } catch (err) {
      console.error(err);
      alert("❌ Failed to save product. Check your connection.");
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
      fat: product.fat || ""
    });
    setEditingProductId(product._id);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Smoothly scrolls back to the form
  };

  const cancelEditProduct = () => { 
    setForm(initialProductForm); 
    setEditingProductId(null); 
  };
  // 👆 -------------------------------- 👆

  // --- SHOP LOGIC ---
  const handleShopSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingShopId) {
        await fetch(`${BASE_URL}/shops/${editingShopId}/admin-edit`, {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(shopForm)
        });
        alert("✅ Shop Updated Successfully!");
      } else {
        await fetch(`${BASE_URL}/shops`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(shopForm)
        });
        alert("✅ Shop Partner Registered!");
      }
      setShopForm(initialShopForm);
      setEditingShopId(null);
      fetchData();
    } catch (err) { alert("❌ Something went wrong."); }
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
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
          <button onClick={() => setActiveTab("products")} style={tabButtonStyle(activeTab === "products")}>📦 Catalog</button>
          <button onClick={() => setActiveTab("shops")} style={tabButtonStyle(activeTab === "shops")}>🏪 Shops</button>
          <button onClick={() => setActiveTab("users")} style={tabButtonStyle(activeTab === "users")}>👤 Users</button>
        </div>
      </nav>

      <div style={{ padding: '30px' }}>
        {loading ? <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div> : (
          <>
            {activeTab === "products" && <ProductsTab products={products} form={form} setForm={setForm} handleProductSubmit={handleProductSubmit} CATEGORIES={CATEGORIES} editingProductId={editingProductId} startEditingProduct={startEditingProduct} cancelEdit={cancelEditProduct} />}
            {activeTab === "shops" && <ShopsTab shops={shops} shopForm={shopForm} setShopForm={setShopForm} handleShopSubmit={handleShopSubmit} editingShopId={editingShopId} startEditingShop={startEditingShop} cancelEditShop={cancelEditShop} />}
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
  cursor: 'pointer' 
});

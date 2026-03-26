import React, { useState, useEffect } from 'react';

export default function ShopDashboard({ user, onExit }) {
  const [activeTab, setActiveTab] = useState("orders"); // orders, store, add
  const [orders, setOrders] = useState([]);
  const [masterCatalog, setMasterCatalog] = useState([]);
  
  // Local state for the shop to instantly reflect changes
  const [shopData, setShopData] = useState(user); 

  const BASE_URL = "https://darkslategrey-snail-415133.hostingersite.com";

  useEffect(() => {
    fetchOrders();
    fetchMasterCatalog();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${BASE_URL}/orders`);
      const allOrders = await res.json();
      // Filter so they ONLY see their own orders
      setOrders(allOrders.filter(o => o.shopId?._id === shopData._id));
    } catch (err) { console.log(err); }
  };

  const fetchMasterCatalog = async () => {
    try {
      const res = await fetch(`${BASE_URL}/master-products`);
      setMasterCatalog(await res.json());
    } catch (err) { console.log(err); }
  };

  // 🏪 Toggle Shop Open/Closed
  const toggleShopStatus = async () => {
    const newStatus = !shopData.isOpen;
    try {
      const res = await fetch(`${BASE_URL}/shops/${shopData._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOpen: newStatus })
      });
      const updatedShop = await res.json();
      setShopData(updatedShop);
    } catch (err) { console.log(err); }
  };

  // 📜 Update Order Status
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

  // 🛒 Add / Update Inventory Logic
  const handleInventoryUpdate = async (productId, sellingPrice, inStock = true) => {
    try {
      const res = await fetch(`${BASE_URL}/shops/${shopData._id}/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, sellingPrice: Number(sellingPrice), inStock })
      });
      const updatedShop = await res.json();
      setShopData(updatedShop);
      // Optional: Add a little toast notification here instead of alert if you prefer
      alert("✅ Store Updated!"); 
    } catch (err) { console.log(err); }
  };

  // 🧮 Filter out items the shop already has
  const shopProductIds = shopData.inventory?.filter(i => i.product).map(i => i.product._id) || [];
  const availableToAdd = masterCatalog.filter(m => !shopProductIds.includes(m._id));

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '70px', fontFamily: 'sans-serif' }}>
      
      {/* 🟢 TOP HEADER (Sticky) */}
      <div style={{ backgroundColor: '#0f172a', color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#10b981' }}>🏪 {shopData.name}</h2>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Partner Dashboard</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {/* THE MASTER SWITCH */}
          <button 
            onClick={toggleShopStatus}
            style={{ 
              padding: '6px 12px', borderRadius: '20px', fontWeight: 'bold', border: 'none', cursor: 'pointer',
              backgroundColor: shopData.isOpen ? '#d1fae5' : '#fee2e2', 
              color: shopData.isOpen ? '#059669' : '#b91c1c' 
            }}
          >
            {shopData.isOpen ? '🟢 OPEN' : '🔴 CLOSED'}
          </button>
          <button onClick={onExit} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold' }}>Logout</button>
        </div>
      </div>

      <div style={{ padding: '15px', maxWidth: '600px', margin: '0 auto' }}>

        {/* --- TAB 1: LIVE ORDERS --- */}
        {activeTab === "orders" && (
          <div>
            <h3 style={{ marginTop: 0, color: '#0f172a' }}>Live Orders ({orders.length})</h3>
            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>No active orders right now.</div>
            ) : orders.map(order => (
              <div key={order._id} style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '10px' }}>
                  <strong style={{ color: '#334155' }}>Order #{order._id.substring(order._id.length - 6).toUpperCase()}</strong>
                  <span style={{ color: order.status === "Delivered ✅" ? '#10b981' : '#f59e0b', fontWeight: 'bold', fontSize: '0.9rem' }}>{order.status}</span>
                </div>
                
                <div style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '15px', lineHeight: '1.5' }}>
                  {order.items.map((i, idx) => (
                    <div key={idx}>• {i.qty}x {i.name}</div>
                  ))}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #e2e8f0' }}>
                  <strong style={{ fontSize: '1.2rem', color: '#0f172a' }}>₹{order.totalAmount}</strong>
                  
                  {order.status === "Pending" && (
                    <button onClick={() => updateOrderStatus(order._id, "Packed & Ready")} style={{ padding: '8px 15px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>
                      Mark Packed 📦
                    </button>
                  )}
                  {order.status === "Packed & Ready" && (
                    <button onClick={() => updateOrderStatus(order._id, "Delivered ✅")} style={{ padding: '8px 15px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>
                      Mark Delivered ✅
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- TAB 2: MY STORE (Inventory Manager) --- */}
        {activeTab === "store" && (
          <div>
            <h3 style={{ marginTop: 0, color: '#0f172a' }}>My Store Pricing</h3>
            {shopData.inventory?.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Your store is empty! Go to 'Add Items'.</div>
            ) : shopData.inventory?.map(item => (
              item.product && (
                <div key={item._id} style={{...cardStyle, display: 'flex', alignItems: 'center', gap: '15px', opacity: item.inStock ? 1 : 0.6 }}>
                  {item.product.image ? <img src={item.product.image} style={{ width: '50px', height: '50px', objectFit: 'contain' }} alt={item.product.name} /> : <span style={{fontSize: '30px'}}>{item.product.emoji}</span>}
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{item.product.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>MRP: ₹{item.product.mrp}</div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ fontWeight: 'bold', color: '#64748b' }}>₹</span>
                      <input 
                        type="number" 
                        defaultValue={item.sellingPrice} 
                        onBlur={(e) => {
                          if(e.target.value !== String(item.sellingPrice)) {
                            handleInventoryUpdate(item.product._id, e.target.value, item.inStock)
                          }
                        }}
                        style={{ width: '60px', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold' }}
                      />
                    </div>
                    <button 
                      onClick={() => handleInventoryUpdate(item.product._id, item.sellingPrice, !item.inStock)}
                      style={{ fontSize: '0.75rem', background: item.inStock ? '#fee2e2' : '#d1fae5', border: 'none', color: item.inStock ? '#b91c1c' : '#059669', fontWeight: 'bold', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px' }}
                    >
                      {item.inStock ? "Mark Out of Stock" : "Mark In Stock"}
                    </button>
                  </div>
                </div>
              )
            ))}
          </div>
        )}

        {/* --- TAB 3: ADD PRODUCTS (Master Catalog) --- */}
        {activeTab === "add" && (
          <div>
            <h3 style={{ marginTop: 0, color: '#0f172a' }}>Add from Master List</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '15px' }}>Set your custom price to add these to your store.</p>
            
            {availableToAdd.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>You have added every product! 🌟</div>
            ) : availableToAdd.map(product => (
              <div key={product._id} style={{...cardStyle, display: 'flex', alignItems: 'center', gap: '15px' }}>
                 {product.image ? <img src={product.image} style={{ width: '50px', height: '50px', objectFit: 'contain' }} alt={product.name} /> : <span style={{fontSize: '30px'}}>{product.emoji}</span>}
                
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{product.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 'bold' }}>MRP: ₹{product.mrp}</div>
                </div>
                
                <button 
                  onClick={() => {
                    const price = prompt(`Enter your selling price for ${product.name}\n(MRP is ₹${product.mrp}):`, product.mrp);
                    if (price && !isNaN(price)) {
                      handleInventoryUpdate(product._id, price, true);
                    }
                  }}
                  style={{ padding: '8px 15px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Add ➕
                </button>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* 📱 BOTTOM TAB BAR (Mobile App Feel) */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'white', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-around', padding: '12px 0', zIndex: 100, boxShadow: '0 -2px 10px rgba(0,0,0,0.05)' }}>
        <button onClick={() => setActiveTab("orders")} style={bottomTabStyle(activeTab === "orders")}>
          <span style={{ fontSize: '1.2rem' }}>📦</span><span>Orders</span>
        </button>
        <button onClick={() => setActiveTab("store")} style={bottomTabStyle(activeTab === "store")}>
          <span style={{ fontSize: '1.2rem' }}>🛒</span><span>My Store</span>
        </button>
        <button onClick={() => setActiveTab("add")} style={bottomTabStyle(activeTab === "add")}>
          <span style={{ fontSize: '1.2rem' }}>➕</span><span>Add Items</span>
        </button>
      </div>

    </div>
  );
}

// Visual Styles
const cardStyle = { backgroundColor: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: '15px', border: '1px solid #f1f5f9' };
const bottomTabStyle = (isActive) => ({ 
  background: 'none', border: 'none', fontSize: '0.75rem', fontWeight: 'bold', 
  color: isActive ? '#10b981' : '#94a3b8', display: 'flex', flexDirection: 'column', 
  alignItems: 'center', gap: '4px', cursor: 'pointer', flex: 1
});
                

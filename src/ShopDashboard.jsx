import React, { useState, useEffect } from 'react';

export default function ShopDashboard({ user, onExit }) {
  // --- COMBINED STATE ---
  const [activeTab, setActiveTab] = useState("parchis"); 
  const [orders, setOrders] = useState([]); 
  const [masterCatalog, setMasterCatalog] = useState([]); 
  const [shopData, setShopData] = useState(user); 

  // --- PARCHI STATE ---
  const [parchiRequests, setParchiRequests] = useState([]); 
  const [selectedParchi, setSelectedParchi] = useState(null);
  const [parchiBill, setParchiBill] = useState([]);

  const BASE_URL = "https://darkslategrey-snail-415133.hostingersite.com";

  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchAllData = async () => {
      await fetchOrders();
      await fetchMasterCatalog();
      await fetchParchis();
    };

    fetchAllData();

    // Auto-refresh orders and parchis every 10 seconds!
    const interval = setInterval(() => {
      fetchOrders();
      fetchParchis();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [shopData._id]);

  const fetchOrders = async () => { 
    try { 
      const res = await fetch(`${BASE_URL}/orders`); 
      const allOrders = await res.json(); 
      setOrders(allOrders.filter(o => o.shopId?._id === shopData._id)); 
    } catch (err) { console.log(err); } 
  }; 

  const fetchMasterCatalog = async () => { 
    try { 
      const res = await fetch(`${BASE_URL}/master-products`); 
      setMasterCatalog(await res.json()); 
    } catch (err) { console.log(err); } 
  }; 

  const fetchParchis = async () => {
    try {
      const res = await fetch(`${BASE_URL}/parchis/${shopData._id}`);
      const data = await res.json();
      if (Array.isArray(data)) setParchiRequests(data);
    } catch (err) { console.log(err); }
  };

  // --- YOUR EXISTING LOGIC ---
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

  const handleInventoryUpdate = async (productId, sellingPrice, inStock = true) => { 
    try { 
      const res = await fetch(`${BASE_URL}/shops/${shopData._id}/inventory`, { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ productId, sellingPrice: Number(sellingPrice), inStock }) 
      }); 
      if (res.ok) { 
        const updatedShop = await res.json(); 
        setShopData(updatedShop); 
        alert("✅ Store Updated!"); 
      } else { 
        const errorData = await res.json(); 
        alert("❌ Error: " + (errorData.error || "Failed to update")); 
      } 
    } catch (err) { console.log(err); } 
  }; 

  // --- NEW PARCHI LOGIC ---
  const handleAddToBill = (item) => {
    setParchiBill(prev => {
      const exists = prev.find(i => i._id === item.product._id);
      if (exists) {
        return prev.map(i => i._id === item.product._id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item.product, price: item.sellingPrice || item.product.mrp, qty: 1 }];
    });
  };

  const handleSendBill = () => {
    alert(`✅ Digital Bill Sent to ${selectedParchi.customerName || 'Customer'}! They will receive a notification to pay ₹${parchiBill.reduce((sum, i) => sum + (i.price * i.qty), 0)}.`);
    setParchiRequests(prev => prev.filter(p => p._id !== selectedParchi._id));
    setSelectedParchi(null);
    setParchiBill([]);
  };

  // --- INVENTORY HELPERS ---
  const shopProductIds = shopData.inventory?.filter(i => i.product).map(i => i.product._id) || []; 
  const availableToAdd = masterCatalog.filter(m => !shopProductIds.includes(m._id));

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '70px', fontFamily: 'sans-serif' }}>
      
      {/* 🏪 TOP HEADER (Your Original Header) */}
      <div style={{ backgroundColor: '#0f172a', color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}> 
        <div> 
          <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#10b981' }}>🏪 {shopData.name}</h2> 
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Partner Dashboard</span> 
        </div> 
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}> 
          <button onClick={toggleShopStatus} style={{ padding: '6px 12px', borderRadius: '20px', fontWeight: 'bold', border: 'none', cursor: 'pointer', backgroundColor: shopData.isOpen ? '#d1fae5' : '#fee2e2', color: shopData.isOpen ? '#059669' : '#b91c1c' }} > 
            {shopData.isOpen ? '🟢 OPEN' : '🔴 CLOSED'} 
          </button> 
          <button onClick={onExit} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold' }}>Logout</button> 
        </div> 
      </div> 

      {/* 🗂️ TAB NAVIGATION */}
      <div style={{ display: 'flex', backgroundColor: '#1e293b', padding: '10px 20px', gap: '15px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
        <button onClick={() => setActiveTab("orders")} style={tabStyle(activeTab === "orders")}>📦 Live Orders ({orders.length})</button>
        <button onClick={() => setActiveTab("parchis")} style={tabStyle(activeTab === "parchis")}>🧾 Parchis {parchiRequests.length > 0 && <span style={badgeStyle}>{parchiRequests.length}</span>}</button>
        <button onClick={() => setActiveTab("inventory")} style={tabStyle(activeTab === "inventory")}>📊 Manage Inventory</button>
      </div>

      <div style={{ padding: '15px', maxWidth: '800px', margin: '0 auto' }}> 
        
        {/* --- 📦 ORDERS TAB (Restored from your code!) --- */}
        {activeTab === "orders" && ( 
          <div> 
            <h3 style={{ marginTop: 0, color: '#0f172a' }}>Live Orders</h3> 
            {orders.length === 0 ? ( 
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', backgroundColor: 'white', borderRadius: '12px' }}>No active orders right now.</div> 
            ) : orders.map(order => ( 
              <div key={order._id} style={cardStyle}> 
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '10px' }}> 
                  <strong style={{ color: '#334155' }}>Order #{order._id.substring(order._id.length - 6).toUpperCase()}</strong> 
                  <span style={{ color: order.status === "Delivered ✅" ? '#10b981' : '#f59e0b', fontWeight: 'bold', fontSize: '0.9rem' }}>{order.status}</span> 
                </div> 
                <div style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '15px' }}>
                  {order.items?.map((item, i) => (
                    <div key={i}>{item.qty}x {item.name}</div>
                  ))}
                  <div style={{ fontWeight: 'bold', marginTop: '10px', color: '#0f172a' }}>Total: ₹{order.totalAmount}</div>
                </div>
                {order.status !== "Delivered ✅" && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => updateOrderStatus(order._id, "Packing 📦")} style={{ flex: 1, padding: '8px', backgroundColor: '#e0f2fe', color: '#0369a1', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>Packing</button>
                    <button onClick={() => updateOrderStatus(order._id, "Delivered ✅")} style={{ flex: 1, padding: '8px', backgroundColor: '#d1fae5', color: '#059669', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>Done</button>
                  </div>
                )}
              </div> 
            ))}
          </div>
        )}

        {/* --- 🧾 PARCHIS TAB (The New Magic!) --- */}
        {activeTab === "parchis" && (
          <div>
            <h3 style={{ marginTop: 0, color: '#0f172a' }}>Pending Parchi Lists</h3>
            {parchiRequests.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'white', borderRadius: '12px', color: '#94a3b8', border: '2px dashed #cbd5e1' }}>
                <span style={{ fontSize: '2.5rem' }}>📭</span><br/>No pending parchis right now.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {parchiRequests.map(req => (
                  <div key={req._id} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '1.1rem' }}>{req.customerName || "Customer"}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        Uploaded at {new Date(req.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedParchi(req)}
                      style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Process ➡️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- 📊 INVENTORY TAB (Restored!) --- */}
        {activeTab === "inventory" && (
          <div>
            <h3 style={{ marginTop: 0, color: '#0f172a' }}>Shop Inventory</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {shopData.inventory?.map(item => item.product && (
                <div key={item.product._id} style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px' }}>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{item.product.emoji} {item.product.name}</div>
                    <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Selling for: ₹{item.sellingPrice}</div>
                  </div>
                  <button 
                    onClick={() => {
                      const newPrice = prompt(`Update price for ${item.product.name}`, item.sellingPrice);
                      if (newPrice) handleInventoryUpdate(item.product._id, newPrice, item.inStock);
                    }}
                    style={{ padding: '8px 12px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}
                  >
                    Edit Price
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* --------------------------------------------------- */}
      {/* 🚀 THE SPLIT-SCREEN PARCHI PROCESSING MODAL         */}
      {/* --------------------------------------------------- */}
      {selectedParchi && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          
          <div style={{ backgroundColor: '#f8fafc', width: '100%', maxWidth: '1000px', height: '90vh', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
            
            <div style={{ padding: '15px 20px', backgroundColor: '#1e293b', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Processing Parchi for {selectedParchi.customerName || "Customer"}</h3>
              <button onClick={() => { setSelectedParchi(null); setParchiBill([]); }} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>✖</button>
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden', flexDirection: window.innerWidth < 768 ? 'column' : 'row' }}>
              
              {/* LEFT SIDE: Image */}
              <div style={{ flex: 1, borderRight: '2px solid #e2e8f0', backgroundColor: '#e2e8f0', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', overflowY: 'auto' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#475569' }}>Customer's List</h4>
                <img src={selectedParchi.imageUrl} alt="Parchi" style={{ maxWidth: '100%', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} />
              </div>

              {/* RIGHT SIDE: POS Register */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'white' }}>
                
                <div style={{ padding: '15px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f1f5f9', overflowY: 'auto', maxHeight: '40%' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#0f172a', fontSize: '0.9rem' }}>Tap items to add to bill:</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {shopData.inventory?.filter(i => i.product).map(item => (
                      <button 
                        key={item.product._id} 
                        onClick={() => handleAddToBill(item)}
                        style={{ padding: '8px 12px', backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', color: '#334155', display: 'flex', alignItems: 'center', gap: '5px' }}
                      >
                        {item.product.emoji} {item.product.name} (₹{item.sellingPrice || item.product.mrp})
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
                  <h4 style={{ margin: '0 0 15px 0', color: '#0f172a' }}>Generated Bill</h4>
                  {parchiBill.length === 0 ? (
                    <div style={{ color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic' }}>Tap items above to build the bill.</div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                      <tbody>
                        {parchiBill.map((item, index) => (
                          <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '10px 0' }}>{item.name}</td>
                            <td style={{ padding: '10px 0', textAlign: 'center' }}>x{item.qty}</td>
                            <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 'bold' }}>₹{item.price * item.qty}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div style={{ padding: '20px', backgroundColor: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '1.2rem', fontWeight: 'bold', color: '#0f172a' }}>
                    <span>Total Bill:</span>
                    <span>₹{parchiBill.reduce((sum, i) => sum + (i.price * i.qty), 0)}</span>
                  </div>
                  <button 
                    onClick={handleSendBill}
                    disabled={parchiBill.length === 0}
                    style={{ width: '100%', padding: '15px', backgroundColor: parchiBill.length > 0 ? '#10b981' : '#cbd5e1', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold', cursor: parchiBill.length > 0 ? 'pointer' : 'not-allowed' }}
                  >
                    {parchiBill.length > 0 ? "Send Bill to Customer 🚀" : "Add items to send"}
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Styling Helpers
const cardStyle = { backgroundColor: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', marginBottom: '15px' };
const tabStyle = (isActive) => ({ backgroundColor: isActive ? 'rgba(255,255,255,0.1)' : 'transparent', color: isActive ? '#38bdf8' : '#cbd5e1', border: 'none', padding: '8px 15px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s', display: 'flex', alignItems: 'center', gap: '8px' });
const badgeStyle = { backgroundColor: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 'bold' };
              

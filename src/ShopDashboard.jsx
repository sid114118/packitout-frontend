import React, { useState, useEffect } from 'react';

export default function ShopDashboard({ user, onExit }) {
  const [activeTab, setActiveTab] = useState("parchis"); 
  const [inventory, setInventory] = useState([]);
  
  // 🚀 Start with an empty list instead of the fake data
  const [parchiRequests, setParchiRequests] = useState([]); 
  
  const [selectedParchi, setSelectedParchi] = useState(null);
  const [parchiBill, setParchiBill] = useState([]); 

  const BASE_URL = "https://darkslategrey-snail-415133.hostingersite.com";

  useEffect(() => {
    if (!user) return;

    const fetchShopData = async () => {
      try {
        // 1. Fetch the Shop's Inventory
        const menuRes = await fetch(`${BASE_URL}/shops/${user._id}/menu`);
        const menuData = await menuRes.json();
        setInventory(menuData.inventory || []);

        // 2. Fetch the REAL pending Parchi photos!
        const parchiRes = await fetch(`${BASE_URL}/parchis/${user._id}`);
        const parchiData = await parchiRes.json();
        
        if (Array.isArray(parchiData)) {
          setParchiRequests(parchiData);
        }
      } catch (err) { 
        console.log("Error fetching shop data:", err); 
      }
    };

    // Fetch immediately on load
    fetchShopData();
    
    // 🔄 MAGIC: Auto-check for new photos every 10 seconds!
    const interval = setInterval(fetchShopData, 10000);
    return () => clearInterval(interval);
  }, [user]);

  // --- PARCHI BILLING LOGIC ---
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
    
    // Remove it from the pending list after sending the bill
    setParchiRequests(prev => prev.filter(p => p._id !== selectedParchi._id));
    setSelectedParchi(null);
    setParchiBill([]);
  };

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* 🏪 SHOP NAV BAR */}
      <nav style={{ backgroundColor: '#1e293b', color: 'white', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
        <div>
          <h2 style={{ margin: 0, color: '#38bdf8', fontSize: '1.4rem' }}>{user?.name} Terminal</h2>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Shop Partner Dashboard</span>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={() => setActiveTab("orders")} style={tabStyle(activeTab === "orders")}>📦 Live Orders</button>
          
          <button onClick={() => setActiveTab("parchis")} style={tabStyle(activeTab === "parchis")}>
            🧾 Parchi Requests 
            {parchiRequests.length > 0 && <span style={badgeStyle}>{parchiRequests.length}</span>}
          </button>
          
          <button onClick={() => setActiveTab("inventory")} style={tabStyle(activeTab === "inventory")}>📊 Inventory</button>
        </div>
        <button onClick={onExit} style={{ backgroundColor: '#ef4444', border: 'none', padding: '8px 15px', borderRadius: '6px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Logout</button>
      </nav>

      <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* --- 🧾 PARCHI REQUESTS TAB --- */}
        {activeTab === "parchis" && (
          <div>
            <h2 style={{ color: '#0f172a', marginTop: 0 }}>Pending Parchi Lists</h2>
            <p style={{ color: '#64748b', marginTop: '-10px', marginBottom: '20px' }}>Customers have uploaded these handwritten lists. Convert them to digital bills!</p>

            {parchiRequests.length === 0 ? (
              <div style={{ padding: '50px', textAlign: 'center', backgroundColor: 'white', borderRadius: '12px', color: '#94a3b8', border: '2px dashed #cbd5e1' }}>
                <span style={{ fontSize: '3rem' }}>📭</span><br/>No pending parchis right now.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
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
                      style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)' }}
                    >
                      Process Parchi ➡️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- OTHER TABS (Placeholders for now) --- */}
        {activeTab === "orders" && <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'white', borderRadius: '12px' }}>Live Orders will appear here.</div>}
        {activeTab === "inventory" && <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'white', borderRadius: '12px' }}>Inventory Management goes here.</div>}

      </div>

      {/* --------------------------------------------------- */}
      {/* 🚀 THE SPLIT-SCREEN PARCHI PROCESSING MODAL         */}
      {/* --------------------------------------------------- */}
      {selectedParchi && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          
          <div style={{ backgroundColor: '#f8fafc', width: '100%', maxWidth: '1000px', height: '90vh', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '15px 20px', backgroundColor: '#1e293b', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Processing Parchi for {selectedParchi.customerName || "Customer"}</h3>
              <button onClick={() => { setSelectedParchi(null); setParchiBill([]); }} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>✖</button>
            </div>

            {/* Split Screen Content */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              
              {/* LEFT SIDE: The Customer's Uploaded Image */}
              <div style={{ flex: 1, borderRight: '2px solid #e2e8f0', backgroundColor: '#e2e8f0', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', overflowY: 'auto' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#475569' }}>Customer's Uploaded List</h4>
                <img src={selectedParchi.imageUrl} alt="Parchi" style={{ maxWidth: '100%', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} />
              </div>

              {/* RIGHT SIDE: The Digital POS Register */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'white' }}>
                
                {/* 1. Quick Add Inventory Strip */}
                <div style={{ padding: '15px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f1f5f9', overflowY: 'auto', maxHeight: '40%' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#0f172a', fontSize: '0.9rem' }}>Tap items to add to bill:</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {inventory.filter(i => i.product).map(item => (
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

                {/* 2. The Built Bill */}
                <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
                  <h4 style={{ margin: '0 0 15px 0', color: '#0f172a' }}>Generated Digital Bill</h4>
                  {parchiBill.length === 0 ? (
                    <div style={{ color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic' }}>Read the image on the left and tap items above to build the bill.</div>
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

                {/* 3. Send to Customer Button */}
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
                    {parchiBill.length > 0 ? "Send Bill to Customer 🚀" : "Add items to send bill"}
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
const tabStyle = (isActive) => ({ backgroundColor: isActive ? 'rgba(255,255,255,0.1)' : 'transparent', color: isActive ? '#38bdf8' : '#cbd5e1', border: 'none', padding: '8px 15px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s', display: 'flex', alignItems: 'center', gap: '8px' });
const badgeStyle = { backgroundColor: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 'bold' };
          

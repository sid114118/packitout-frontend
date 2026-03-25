import React, { useState, useEffect } from 'react';

export default function AdminDashboard({ onExit }) {
  const [currentView, setCurrentView] = useState("overview"); 
  const [status, setStatus] = useState("");
  
  const [pendingRequests, setPendingRequests] = useState([]);
  const [masterCatalog, setMasterCatalog] = useState([]); // 👈 NEW: Holds your catalog data

  // Form States
  const [shopName, setShopName] = useState("");
  const [pincode, setPincode] = useState("");
  const [mpName, setMpName] = useState("");
  const [mpBrand, setMpBrand] = useState("");
  const [mpCategory, setMpCategory] = useState("Grocery & Kitchen");
  const [mpMrp, setMpMrp] = useState("");
  const [mpQnty, setMpQnty] = useState("");
  const [mpEmoji, setMpEmoji] = useState("");
  const [mpTags, setMpTags] = useState("");

  // 🔔 FETCH DATA WHEN VIEW CHANGES
  useEffect(() => {
    // 1. Fetch pending requests
    fetch("https://darkslategrey-snail-415133.hostingersite.com/product-requests")
      .then(res => res.json())
      .then(data => setPendingRequests(data.filter(r => r.status === "Pending")))
      .catch(err => console.log(err));

    // 2. Fetch the Master Catalog ONLY if they open that screen
    if (currentView === "viewCatalog") {
      fetch("https://darkslategrey-snail-415133.hostingersite.com/master-products")
        .then(res => res.json())
        .then(data => setMasterCatalog(data))
        .catch(err => console.log(err));
    }
  }, [currentView]);

  // Handle Form Submissions
  const handleAddShop = async (e) => { e.preventDefault(); /* ...omitted for space, assuming same as before...*/ };
  
  const handleAddMasterProduct = async (e) => {
    e.preventDefault();
    setStatus("⏳ Saving Master Product...");
    try {
      const res = await fetch("https://darkslategrey-snail-415133.hostingersite.com/master-products", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: mpName, brand: mpBrand, category: mpCategory, mrp: Number(mpMrp), qnty: mpQnty, emoji: mpEmoji, searchTags: mpTags })
      });
      if(res.ok) { 
        setStatus("✅ Added to Master Catalog!"); 
        setMpName(""); setMpBrand(""); setMpMrp(""); setMpQnty(""); setMpEmoji(""); setMpTags(""); 
        setTimeout(() => {setStatus(""); setCurrentView("overview")}, 2000); 
      }
    } catch (err) { setStatus("❌ Error"); }
  };

  const handleReviewClick = (request) => {
    setMpName(request.requestedName);
    setMpMrp(request.requestedSellingPrice);
    setCurrentView("addMasterProduct"); 
  };

  // --- 📋 NEW VIEW: CATALOG LIST ---
  if (currentView === "viewCatalog") {
    return (
      <div style={{ backgroundColor: '#0f172a', minHeight: '100vh', color: '#f8fafc', padding: '20px', fontFamily: 'sans-serif' }}>
        <button onClick={() => setCurrentView("overview")} style={{ background: '#334155', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', marginBottom: '20px' }}>⬅ Back</button>
        <h2 style={{ color: '#10b981', marginBottom: '20px' }}>📋 Master Catalog</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {masterCatalog.length === 0 ? (
             <p style={{ color: '#94a3b8', textAlign: 'center', marginTop: '20px' }}>Catalog is empty or loading...</p>
          ) : (
            masterCatalog.map((product, index) => (
              <div key={index} style={{ backgroundColor: '#1e293b', padding: '15px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.2)' }}>
                <div style={{ fontSize: '2.5rem', backgroundColor: '#0f172a', padding: '10px', borderRadius: '10px' }}>{product.emoji || "📦"}</div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: '#f8fafc' }}>{product.name}</h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>{product.brand} • {product.qnty}</p>
                  <span style={{ fontSize: '0.75rem', color: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.1)', padding: '2px 6px', borderRadius: '4px', marginTop: '5px', display: 'inline-block' }}>{product.category}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#10b981' }}>₹{product.mrp}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // --- 🔴 VIEW: ADD SHOP (Compressed for space) ---
  if (currentView === "addShop") {
     return <div style={{ backgroundColor: '#0f172a', minHeight: '100vh', color: '#f8fafc', padding: '20px' }}><button onClick={() => setCurrentView("overview")}>⬅ Back</button><h2>🏪 Add Shop under construction</h2></div>;
  }

  // --- 🟣 VIEW: ADD MASTER PRODUCT ---
  if (currentView === "addMasterProduct") {
    return (
      <div style={{ backgroundColor: '#0f172a', minHeight: '100vh', color: '#f8fafc', padding: '20px', fontFamily: 'sans-serif' }}>
        <button onClick={() => setCurrentView("overview")} style={{ background: '#334155', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', marginBottom: '20px' }}>⬅ Back</button>
        <h2 style={{ color: '#a855f7' }}>📦 Add Master Product</h2>
        <form onSubmit={handleAddMasterProduct} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input type="text" placeholder="Product Name" value={mpName} onChange={(e)=>setMpName(e.target.value)} required style={{ padding: '12px', borderRadius: '8px', background: '#1e293b', color: 'white', border: '1px solid #334155' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <input type="text" placeholder="Brand" value={mpBrand} onChange={(e)=>setMpBrand(e.target.value)} style={{ padding: '12px', borderRadius: '8px', background: '#1e293b', color: 'white', border: '1px solid #334155' }} />
            <input type="number" placeholder="MRP" value={mpMrp} onChange={(e)=>setMpMrp(e.target.value)} style={{ padding: '12px', borderRadius: '8px', background: '#1e293b', color: 'white', border: '1px solid #334155' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <input type="text" placeholder="Qnty (e.g. 500g)" value={mpQnty} onChange={(e)=>setMpQnty(e.target.value)} style={{ padding: '12px', borderRadius: '8px', background: '#1e293b', color: 'white', border: '1px solid #334155' }} />
            <input type="text" placeholder="Emoji (e.g. 🍞)" value={mpEmoji} onChange={(e)=>setMpEmoji(e.target.value)} style={{ padding: '12px', borderRadius: '8px', background: '#1e293b', color: 'white', border: '1px solid #334155' }} />
          </div>
          <select value={mpCategory} onChange={(e)=>setMpCategory(e.target.value)} style={{ padding: '12px', borderRadius: '8px', background: '#1e293b', color: 'white', border: '1px solid #334155' }}>
            <option>Grocery & Kitchen</option><option>Snacks & Drinks</option><option>Household & Personal Care</option>
          </select>
          <input type="text" placeholder="Search Tags (comma separated)" value={mpTags} onChange={(e)=>setMpTags(e.target.value)} style={{ padding: '12px', borderRadius: '8px', background: '#1e293b', color: 'white', border: '1px solid #334155' }} />
          <button type="submit" style={{ padding: '15px', background: '#a855f7', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>Update Global Catalog</button>
        </form>
        {status && <p style={{ textAlign: 'center', color: '#fef08a', marginTop: '20px' }}>{status}</p>}
      </div>
    );
  }

  // --- 🟡 VIEW: REVIEW REQUESTS ---
  if (currentView === "reviewRequests") {
     return <div style={{ backgroundColor: '#0f172a', minHeight: '100vh', color: '#f8fafc', padding: '20px' }}><button onClick={() => setCurrentView("overview")}>⬅ Back</button><h2>🚨 Requests</h2></div>;
  }

  // --- 🟢 VIEW: OVERVIEW ---
  return (
    <div style={{ backgroundColor: '#0f172a', minHeight: '100vh', color: '#f8fafc', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '15px', marginBottom: '20px' }}>
        <div><h1 style={{ margin: 0, fontSize: '1.5rem', color: '#38bdf8' }}>⚙️ Command Center</h1><span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Super Admin Authority</span></div>
        <button onClick={onExit} style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold' }}>Exit</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
        <div style={{ backgroundColor: '#1e293b', padding: '15px', borderRadius: '12px', borderLeft: '4px solid #38bdf8' }}><p style={{ margin: '0 0 5px 0', fontSize: '0.8rem', color: '#cbd5e1' }}>TOTAL SHOPS</p><h2 style={{ margin: 0 }}>{pendingRequests.length + 2}</h2></div>
        <div style={{ backgroundColor: '#1e293b', padding: '15px', borderRadius: '12px', borderLeft: '4px solid #10b981' }}><p style={{ margin: '0 0 5px 0', fontSize: '0.8rem', color: '#cbd5e1' }}>CATALOG SIZE</p><h2 style={{ margin: 0 }}>{masterCatalog.length > 0 ? masterCatalog.length : 452}</h2></div>
      </div>

      <h3 style={{ color: '#94a3b8', fontSize: '1rem', marginBottom: '15px' }}>Management Tools</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        
        {/* 👇 THE NEW "VIEW CATALOG" BUTTON */}
        <button onClick={() => setCurrentView("viewCatalog")} style={{ padding: '16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}>
          <span>📋 View Master Catalog</span> <span>→</span>
        </button>

        <button onClick={() => setCurrentView("addMasterProduct")} style={{ padding: '16px', background: '#a855f7', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}>
          <span>📦 Add New Product</span> <span>+</span>
        </button>
        
        <button onClick={() => setCurrentView("addShop")} style={{ padding: '16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}>
          <span>🏪 Shop Registration</span> <span>+</span>
        </button>
      </div>

    </div>
  );
                                }

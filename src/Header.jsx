import React, { useState } from 'react';

export default function Header({ user }) {
  // 🧭 UI States for changing the shop
  const [isChanging, setIsChanging] = useState(false);
  const [pincode, setPincode] = useState("");
  const [shops, setShops] = useState([]);
  const [loadingShops, setLoadingShops] = useState(false);
  const [selectedShopId, setSelectedShopId] = useState("");
  
  // 🛡️ NEW: Tracks if the user actually clicked "Find" to prevent premature errors
  const [hasSearched, setHasSearched] = useState(false); 
  
  const [activeShopName, setActiveShopName] = useState(user?.primaryShop?.name || "");

  const handleFindShops = async () => {
    if (!pincode) return;
    setLoadingShops(true);
    setHasSearched(false); // Reset search state before fetching
    
    try {
      const res = await fetch(`https://darkslategrey-snail-415133.hostingersite.com/shops/all/${pincode}`);
      const data = await res.json();
      setShops(data);
      if (data.length > 0) setSelectedShopId(data[0]._id);
    } catch (err) {
      console.log("Error finding shops", err);
    }
    
    setLoadingShops(false);
    setHasSearched(true); // Mark that a search has officially completed
  };

  const handleSaveShop = async () => {
    if (!user) {
      alert("Please log in to save your preferred shop!");
      window.location.hash = "#account";
      return;
    }
    if (!selectedShopId) return;

    try {
      const res = await fetch(`https://darkslategrey-snail-415133.hostingersite.com/users/${user._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pincode: pincode, primaryShop: selectedShopId })
      });
      const updatedUser = await res.json();
      
      localStorage.setItem("packitout_user", JSON.stringify(updatedUser));
      setActiveShopName(updatedUser.primaryShop?.name || "");
      setIsChanging(false);
      setShops([]); 
      setHasSearched(false);
    } catch (err) {
      console.log("Error saving shop", err);
    }
  };

  // 📝 UPDATED: Smart Text Logic
  const hasLocation = activeShopName || user?.pincode;
  
  const displayText = activeShopName 
    ? `🏪 Shopping from: ${activeShopName}` 
    : user?.pincode 
    ? `📍 Shopping near: ${user.pincode}` 
    : "📍 No shop selected";

  const buttonText = isChanging 
    ? "Cancel ❌" 
    : hasLocation 
    ? "Change 🔽" 
    : "Select 🔽";

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 1000, boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
      
      {/* 🟢 TOP ROW: Brand & Navigation */}
      <div style={{ backgroundColor: '#2f3640', color: 'white', padding: '10px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        
        {/* Hamburger Menu & Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.4rem', cursor: 'pointer', padding: 0 }}>
            ☰
          </button>
          <h1 
            onClick={() => window.location.hash = ""} 
            style={{ margin: 0, fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#10b981', fontWeight: '900' }}
          >
            📦 PackItOut
          </h1>
        </div>

        {/* Clickable Icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={() => window.location.hash = "#account"} style={iconBtnStyle} title="My Profile">👤</button>
          <button onClick={() => window.location.hash = "#cart"} style={iconBtnStyle} title="View Cart">🛒</button>
        </div>
      </div>

      {/* 📍 BOTTOM ROW: The Slim Location Pill */}
      <div style={{ backgroundColor: '#1e272e', padding: '6px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #3d566e' }}>
        <span style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {displayText}
        </span>
        <button 
          onClick={() => {
            setIsChanging(!isChanging);
            setHasSearched(false); // Reset error state if they close and reopen
          }}
          style={{ background: 'none', border: 'none', color: '#10b981', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}
        >
          {buttonText}
        </button>
      </div>

      {/* 🔍 EXPANDING SHOP SELECTOR */}
      {isChanging && (
        <div style={{ backgroundColor: '#2f3640', padding: '15px', borderTop: '1px solid #3d566e', boxShadow: 'inset 0 4px 6px rgba(0,0,0,0.1)' }}>
          
          {/* 1. Enter Pincode */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <input 
              type="text" 
              placeholder="Enter Pincode..." 
              value={pincode} 
              onChange={e => {
                setPincode(e.target.value);
                setHasSearched(false); // 🛡️ Instantly hide errors when they start typing a new code
              }}
              style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', outline: 'none', backgroundColor: '#f1f5f9', fontWeight: 'bold' }}
            />
            <button 
              onClick={handleFindShops} 
              style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '0 15px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              {loadingShops ? "..." : "Find"}
            </button>
          </div>
          
          {/* 2. Select Shop (If shops are found) */}
          {shops.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', animation: 'fadeIn 0.3s' }}>
              <select 
                value={selectedShopId} 
                onChange={e => setSelectedShopId(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: 'none', outline: 'none', backgroundColor: '#f1f5f9', fontWeight: 'bold', color: '#2f3640' }}
              >
                {shops.map(s => <option key={s._id} value={s._id}>{s.name} ({s.pincode})</option>)}
              </select>
              <button 
                onClick={handleSaveShop} 
                style={{ width: '100%', padding: '10px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Save My Shop
              </button>
            </div>
          )}

          {/* 🛡️ Fixed Error Message: Only shows AFTER searching */}
          {shops.length === 0 && hasSearched && !loadingShops && (
            <div style={{ color: '#fca5a5', fontSize: '0.85rem', textAlign: 'center', marginTop: '10px', padding: '8px', backgroundColor: 'rgba(252, 165, 165, 0.1)', borderRadius: '6px' }}>
              ❌ No shops found in {pincode}. Try another area!
            </div>
          )}
        </div>
      )}

    </header>
  );
}

const iconBtnStyle = { background: 'none', border: 'none', color: 'white', fontSize: '1.3rem', cursor: 'pointer', padding: 0 };

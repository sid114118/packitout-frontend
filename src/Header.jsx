import React, { useState } from 'react';

export default function Header({ user }) {
  const [isChanging, setIsChanging] = useState(false);
  const [pincode, setPincode] = useState("");
  const [shops, setShops] = useState([]);
  const [loadingShops, setLoadingShops] = useState(false);
  const [selectedShopId, setSelectedShopId] = useState("");
  const [hasSearched, setHasSearched] = useState(false); 
  const [activeShopName, setActiveShopName] = useState(user?.primaryShop?.name || "");
  
  // 🟢 Check if shop is open
  const isShopOpen = user?.primaryShop?.isOpen !== false; 

  const handleFindShops = async () => {
    if (!pincode) return;
    setLoadingShops(true);
    setHasSearched(false); 
    
    try {
      const res = await fetch(`https://darkslategrey-snail-415133.hostingersite.com/shops/all/${pincode}`);
      const data = await res.json();
      setShops(data);
      if (data.length > 0) setSelectedShopId(data[0]._id);
    } catch (err) {
      console.log("Error finding shops", err);
    }
    
    setLoadingShops(false);
    setHasSearched(true); 
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
      window.location.reload(); 
    } catch (err) {
      console.log("Error saving shop", err);
    }
  };

  const hasLocation = activeShopName || user?.pincode;
  const topText = hasLocation ? "Shopping from" : "No location";
  const bottomText = activeShopName ? activeShopName : user?.pincode ? `Pincode: ${user.pincode}` : "Select a shop";

  // Removed position: 'sticky' and top: 0 so App.jsx can control the animation!
  return (
    <header style={{ backgroundColor: '#ffffff', position: 'relative', zIndex: 1000, borderBottom: isChanging ? 'none' : '1px solid #f3f4f6' }}>
      
      <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        
        {/* LEFT: Stacked Location Button with Open Status & CHANGE text */}
        <div 
          onClick={() => setIsChanging(!isChanging)} 
          style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
        >
          <div style={{ fontSize: '1.6rem' }}>📍</div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            
            {/* Top row: Shopping From + OPEN Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {topText}
              </span>
              {activeShopName && (
                <span style={{ fontSize: '0.55rem', padding: '2px 5px', borderRadius: '4px', backgroundColor: isShopOpen ? '#d1fae5' : '#fee2e2', color: isShopOpen ? '#059669' : '#dc2626', fontWeight: '900', letterSpacing: '0.5px' }}>
                  {isShopOpen ? '🟢 OPEN' : '🔴 CLOSED'}
                </span>
              )}
            </div>

            {/* Bottom row: Shop Name + CHANGE button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#111827', fontWeight: '900', fontSize: '1.05rem', marginTop: '2px' }}>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
                {bottomText}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#0c831f', fontWeight: '800', backgroundColor: '#f4fbf6', padding: '2px 6px', borderRadius: '4px', border: '1px solid #dcfce7' }}>
                {isChanging ? 'CLOSE' : 'CHANGE'}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT: Profile Avatar */}
        <div 
          onClick={() => window.location.hash = "#account"} 
          style={{ width: '38px', height: '38px', backgroundColor: '#f3f4f6', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.2rem', cursor: 'pointer', border: '1px solid #e5e7eb' }}
          title="My Profile"
        >
          👤
        </div>
      </div>

      {/* 🔍 EXPANDING SHOP SELECTOR */}
      {isChanging && (
        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderTop: '1px solid #f3f4f6', borderBottom: '1px solid #e5e7eb', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', animation: 'slideDown 0.2s ease-out', position: 'absolute', width: '100%', boxSizing: 'border-box' }}>
          
          <style>{`@keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }`}</style>

          <div style={{ fontSize: '0.85rem', color: '#111827', fontWeight: '800', marginBottom: '10px' }}>Change your location</div>
          
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input 
              type="text" 
              placeholder="Enter Pincode (e.g. 110001)" 
              value={pincode} 
              onChange={e => {
                setPincode(e.target.value);
                setHasSearched(false); 
              }}
              style={{ flex: 1, padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: '#f8fafc', fontSize: '0.95rem', fontWeight: '600', color: '#111827', boxSizing: 'border-box' }}
            />
            <button 
              onClick={handleFindShops} 
              style={{ backgroundColor: '#0c831f', color: 'white', border: 'none', padding: '0 20px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', fontSize: '0.95rem', boxShadow: '0 2px 6px rgba(12, 131, 31, 0.2)' }}
            >
              {loadingShops ? "..." : "Find"}
            </button>
          </div>
          
          {shops.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', animation: 'fadeIn 0.3s' }}>
              <select 
                value={selectedShopId} 
                onChange={e => setSelectedShopId(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: '#f8fafc', fontWeight: '700', color: '#111827', fontSize: '0.9rem', boxSizing: 'border-box' }}
              >
                {shops.map(s => <option key={s._id} value={s._id}>{s.name} ({s.pincode})</option>)}
              </select>
              <button 
                onClick={handleSaveShop} 
                style={{ width: '100%', padding: '14px', backgroundColor: '#111827', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', fontSize: '1rem' }}
              >
                Confirm Store
              </button>
            </div>
          )}

          {shops.length === 0 && hasSearched && !loadingShops && (
            <div style={{ color: '#b91c1c', fontSize: '0.85rem', textAlign: 'center', marginTop: '10px', padding: '10px', backgroundColor: '#fef2f2', borderRadius: '8px', fontWeight: '600' }}>
              ❌ No shops found in {pincode}. Try another area!
            </div>
          )}
        </div>
      )}
    </header>
  );
}

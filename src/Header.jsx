import React, { useState } from 'react';
import { useToast } from './ui/DialogProvider.jsx';

const BASE_URL = (import.meta.env.VITE_API_BASE || "https://darkslategrey-snail-415133.hostingersite.com");

export default function Header({ user, onUserUpdate }) {
  const toast = useToast();
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
      const res = await fetch(`${BASE_URL}/shops/all/${pincode}`);
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
      toast("Please log in to save your preferred shop!", 'info');
      window.location.hash = "#account";
      return;
    }
    if (!selectedShopId) return;

    try {
      const res = await fetch(`${BASE_URL}/users/${user._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pincode: pincode, primaryShop: selectedShopId })
      });
      const updatedUser = await res.json();

      // App.jsx always passes onUserUpdate; the bare localStorage fallback
      // would desync React state, so we no-op in that case.
      if (onUserUpdate) onUserUpdate(updatedUser, { clearCart: true });

      setActiveShopName(updatedUser.primaryShop?.name || "");
      setIsChanging(false);
      setShops([]);
      setHasSearched(false);
      toast("Shop updated! 🏪");
    } catch (err) {
      console.log("Error saving shop", err);
      toast("Could not save shop. Try again.", 'error');
    }
  };

  const hasLocation = activeShopName || user?.pincode;
  const topText = hasLocation ? "Shopping from" : "No location";
  const bottomText = activeShopName ? activeShopName : user?.pincode ? `Pincode: ${user.pincode}` : "Select a shop";

  // Removed position: 'sticky' and top: 0 so App.jsx can control the animation!
  return (
    <header style={{ backgroundColor: '#ffffff', position: 'relative', zIndex: 1000, borderBottom: isChanging ? 'none' : '1px solid #f3f4f6' }}>
      
      <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>

        {/* LEFT: Stacked Location Button with Open Status & CHANGE text */}
        <div
          onClick={() => setIsChanging(!isChanging)}
          role="button"
          tabIndex={0}
          aria-expanded={isChanging}
          className="pio-press"
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1, minWidth: 0 }}
        >
          <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0, flex: 1 }}>

            {/* Top row: Shopping From + OPEN Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                {topText}
              </span>
              {activeShopName && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.6rem', padding: '2px 6px', borderRadius: '999px', backgroundColor: isShopOpen ? '#dcfce7' : '#fee2e2', color: isShopOpen ? '#15803d' : '#b91c1c', fontWeight: 800, letterSpacing: '0.3px' }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: isShopOpen ? '#16a34a' : '#dc2626' }} />
                  {isShopOpen ? 'OPEN' : 'CLOSED'}
                </span>
              )}
            </div>

            {/* Bottom row: Shop Name + chevron */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0f172a', fontWeight: 800, fontSize: '1rem', marginTop: '2px', minWidth: 0 }}>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0, letterSpacing: '-0.2px' }}>
                {bottomText}
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0, transform: isChanging ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>
        </div>

        {/* RIGHT: Profile Avatar */}
        <button
          onClick={() => window.location.hash = "#account"}
          aria-label="My profile"
          className="pio-press"
          style={{ width: '40px', height: '40px', backgroundColor: '#f4f6f8', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', border: '1px solid #e2e8f0', flexShrink: 0, padding: 0 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="7.5" r="3.75" />
            <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
          </svg>
        </button>
      </div>

      {/* 🔍 EXPANDING SHOP SELECTOR */}
      {isChanging && (
        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #e2e8f0', boxShadow: '0 10px 20px -8px rgba(15,23,42,0.08)', animation: 'slideDown 0.22s ease-out', boxSizing: 'border-box' }}>

          <style>{`@keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }`}</style>

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

import React, { useState } from 'react';

export default function Header() {
  const [pincode, setPincode] = useState("");
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState("");

  // This is the bridge that talks to your new Shops database!
  const handleSearch = async () => {
    if (!pincode) return;
    try {
      const response = await fetch(`https://darkslategrey-snail-415133.hostingersite.com/shops/${pincode}`);
      const data = await response.json();
      setShops(data); // Save the shops to the dropdown
    } catch (err) {
      console.log("Failed to fetch shops", err);
    }
  };

  return (
    <header style={{ backgroundColor: '#2c3e50', color: '#ffffff', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
      
      {/* --- TOP ROW: Menu, Logo, and Icons --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <svg viewBox="0 0 24 24" width="26" height="26" stroke="currentColor" strokeWidth="2" fill="none">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
          <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold' }}>📦 PackItOut</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2" fill="none">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2" fill="none">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
        </div>
      </div>

      {/* --- BOTTOM ROW: Functional Pincode & Shop Selectors --- */}
      <div style={{ backgroundColor: '#1a252f', padding: '12px 15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        
        {/* Pincode Input & Search Button */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', backgroundColor: '#2c3e50', padding: '8px 12px', borderRadius: '6px', border: '1px solid #3d566e' }}>
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="#ff4757" strokeWidth="2" fill="none" style={{ marginRight: '8px' }}>
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <input 
              type="text" 
              placeholder="Enter Pincode..." 
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              style={{ backgroundColor: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%', fontSize: '0.95rem' }}
            />
          </div>
          <button 
            onClick={handleSearch}
            style={{ backgroundColor: '#2ed5
              

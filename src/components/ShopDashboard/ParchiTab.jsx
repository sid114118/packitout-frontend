import React, { useState } from 'react';
import { cdnImage } from '../../utils/cloudinaryUrl.js';

export default function ParchiTab({
  parchiRequests,
  selectedParchi,
  setSelectedParchi,
  parchiBill,
  setParchiBill,
  handleAddToBill,
  handleSendBill,
  shopData
}) {
  const [searchQuery, setSearchQuery] = useState("");

  // --- 🛠️ CART MANAGEMENT HELPERS ---
  const updateItemQty = (itemId, change) => {
    setParchiBill(prev => prev.map(item => {
      if (item._id === itemId) {
        const newQty = item.qty + change;
        return newQty > 0 ? { ...item, qty: newQty } : item;
      }
      return item;
    }));
  };

  const removeItem = (itemId) => {
    setParchiBill(prev => prev.filter(item => item._id !== itemId));
  };

  return (
    <div>
      {/* --- PENDING PARCHI LIST --- */}
      <h3 style={{ marginTop: 0, color: '#0f172a', fontSize: '1.4rem' }}>Pending Parchi Lists</h3>
      
      {parchiRequests.length === 0 ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', backgroundColor: 'white', borderRadius: '16px', color: '#94a3b8', border: '2px dashed #cbd5e1' }}>
          <span style={{ fontSize: '3.5rem' }}>📭</span>
          <h3 style={{ color: '#475569', margin: '10px 0 5px 0' }}>All Caught Up!</h3>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>No pending parchis right now.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
          {parchiRequests.map(req => (
            <div key={req._id} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '10px', backgroundColor: '#f1f5f9', overflow: 'hidden', flexShrink: 0 }}>
                  <img src={cdnImage(req.imageUrl, 150)} alt="Parchi Thumbnail" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div>
                  <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '1.1rem' }}>{req.customerName || "Customer"}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '500' }}>
                    Uploaded at {new Date(req.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedParchi(req)}
                style={{ width: '100%', backgroundColor: '#0f172a', color: 'white', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s', fontSize: '0.95rem' }}
              >
                Process List ➡️
              </button>
            </div>
          ))}
        </div>
      )}

      {/* --------------------------------------------------- */}
      {/* 🚀 FULL-SCREEN PARCHI PROCESSING WORKSPACE          */}
      {/* --------------------------------------------------- */}
      {selectedParchi && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#f8fafc', zIndex: 10000, display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.2s ease-out' }}>
          
          <style>{`@keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }`}</style>
          
          {/* 🔝 WORKSPACE HEADER */}
          <div style={{ padding: '15px 25px', backgroundColor: '#0f172a', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', zIndex: 10 }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>DIGITAL POS TERMINAL</span>
              <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#f8fafc' }}>Building Bill for <span style={{ color: '#38bdf8' }}>{selectedParchi.customerName || "Customer"}</span></h2>
            </div>
            <button 
              onClick={() => { setSelectedParchi(null); setParchiBill([]); setSearchQuery(""); }} 
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '40px', height: '40px', borderRadius: '50%', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'background 0.2s' }}
            >
              ✕
            </button>
          </div>

          {/* 🔀 MAIN SPLIT SCREEN */}
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden', flexDirection: window.innerWidth < 1024 ? 'column' : 'row' }}>
            
            {/* 📸 LEFT SIDE: DARK MODE IMAGE VIEWER */}
            <div style={{ flex: '1 1 45%', backgroundColor: '#1e293b', padding: '20px', display: 'flex', flexDirection: 'column', overflowY: 'auto', borderRight: '1px solid #334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h4 style={{ margin: 0, color: '#e2e8f0', fontSize: '1.1rem' }}>Original List</h4>
                <a href={selectedParchi.imageUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem', color: '#38bdf8', textDecoration: 'none', backgroundColor: 'rgba(56, 189, 248, 0.1)', padding: '6px 12px', borderRadius: '20px', fontWeight: 'bold' }}>
                  Open Full Size ↗
                </a>
              </div>
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
                <img src={cdnImage(selectedParchi.imageUrl, 800)} alt="Parchi" decoding="async" style={{ maxWidth: '100%', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} />
              </div>
            </div>

            {/* 💻 RIGHT SIDE: POS SYSTEM */}
            <div style={{ flex: '1 1 55%', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
              
              {/* --- TOP HALF: INVENTORY SEARCH & TAP --- */}
              <div style={{ padding: '20px', backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', height: '50%' }}>
                
                {/* 🔍 SEARCH BAR */}
                <div style={{ position: 'relative', marginBottom: '15px' }}>
                  <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', fontSize: '1.2rem' }}>🔍</span>
                  <input 
                    type="text" 
                    placeholder="Search items by name to add..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: '100%', padding: '14px 14px 14px 45px', borderRadius: '12px', border: '2px solid #e2e8f0', fontSize: '1.05rem', boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.2s', backgroundColor: '#f8fafc' }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>

                {/* 📦 INVENTORY BUTTONS (Scrollable) */}
                <div className="hide-scroll" style={{ flex: 1, overflowY: 'auto', alignContent: 'flex-start' }}>
                  
                  {/* 🛡️ NEW LOGIC: Hide items if search is empty */}
                  {searchQuery.trim() === "" ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                      <span style={{ fontSize: '3rem', marginBottom: '10px' }}>⌨️</span>
                      <span style={{ fontWeight: 'bold', color: '#64748b', fontSize: '1.1rem' }}>Search to find items</span>
                      <span style={{ fontSize: '0.9rem', marginTop: '4px' }}>Type a product name above to add it to the bill.</span>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px', paddingBottom: '10px' }}>
                        {shopData.inventory
                          ?.filter(i => i.product)
                          ?.filter(i => i.product.name.toLowerCase().includes(searchQuery.toLowerCase()))
                          .map(item => (
                            <button 
                              key={item.product._id} 
                              onClick={() => {
                                handleAddToBill(item);
                                setSearchQuery(""); // Automatically clear search bar after tapping!
                              }}
                              style={{ padding: '12px 10px', backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', transition: 'all 0.1s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
                              onMouseDown={(e) => Object.assign(e.currentTarget.style, { transform: 'scale(0.96)', backgroundColor: '#f1f5f9', borderColor: '#3b82f6' })}
                              onMouseUp={(e) => Object.assign(e.currentTarget.style, { transform: 'scale(1)', backgroundColor: 'white', borderColor: '#cbd5e1' })}
                              onMouseLeave={(e) => Object.assign(e.currentTarget.style, { transform: 'scale(1)', backgroundColor: 'white', borderColor: '#cbd5e1' })}
                            >
                              <span style={{ fontSize: '1.8rem' }}>{item.product.emoji || '📦'}</span>
                              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#1e293b', textAlign: 'center', lineHeight: '1.2' }}>{item.product.name}</span>
                              <span style={{ fontSize: '0.85rem', fontWeight: '900', color: '#10b981' }}>₹{item.sellingPrice || item.product.mrp}</span>
                            </button>
                        ))}
                      </div>
                      
                      {shopData.inventory?.filter(i => i.product && i.product.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                        <div style={{ padding: '40px 20px', color: '#94a3b8', fontSize: '1rem', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #ef4444' }}>
                          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🚫</div>
                          No items found matching <strong>"{searchQuery}"</strong>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* --- BOTTOM HALF: LIVE CART --- */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                
                {/* 🛒 CART LIST */}
                <div className="hide-scroll" style={{ flex: 1, padding: '20px', overflowY: 'auto', backgroundColor: '#f8fafc' }}>
                  <h4 style={{ margin: '0 0 15px 0', color: '#0f172a', fontSize: '1.1rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>Current Bill</h4>
                  
                  {parchiBill.length === 0 ? (
                    <div style={{ color: '#94a3b8', fontSize: '1rem', fontStyle: 'italic', textAlign: 'center', marginTop: '40px' }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🛒</div>
                      Your cart is empty.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {parchiBill.map((item, index) => (
                        <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '12px 15px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
                          
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '0.95rem' }}>{item.name}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>₹{item.price} each</div>
                          </div>

                          {/* 🎛️ CART CONTROLS */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginRight: '15px' }}>
                            <button onClick={() => updateItemQty(item._id, -1)} style={cartBtnStyle}>-</button>
                            <span style={{ fontWeight: '800', width: '20px', textAlign: 'center' }}>{item.qty}</span>
                            <button onClick={() => updateItemQty(item._id, 1)} style={cartBtnStyle}>+</button>
                          </div>

                          <div style={{ width: '70px', textAlign: 'right', fontWeight: '900', color: '#0f172a', fontSize: '1.05rem', marginRight: '15px' }}>
                            ₹{item.price * item.qty}
                          </div>

                          <button onClick={() => removeItem(item._id)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1rem' }}>
                            🗑️
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 💳 CHECKOUT FOOTER */}
                <div style={{ padding: '20px', backgroundColor: 'white', borderTop: '1px solid #e2e8f0', boxShadow: '0 -10px 20px rgba(0,0,0,0.02)', zIndex: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '15px' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Total Amount</span>
                    <span style={{ fontSize: '2rem', fontWeight: '900', color: '#10b981', lineHeight: '1' }}>
                      ₹{parchiBill.reduce((sum, i) => sum + (i.price * i.qty), 0)}
                    </span>
                  </div>
                  
                  <button 
                    onClick={() => { handleSendBill(); setSearchQuery(""); }}
                    disabled={parchiBill.length === 0}
                    style={{ width: '100%', padding: '18px', backgroundColor: parchiBill.length > 0 ? '#0c831f' : '#cbd5e1', color: 'white', border: 'none', borderRadius: '12px', fontSize: '1.2rem', fontWeight: '900', cursor: parchiBill.length > 0 ? 'pointer' : 'not-allowed', boxShadow: parchiBill.length > 0 ? '0 8px 20px rgba(12, 131, 31, 0.25)' : 'none', transition: 'all 0.2s' }}
                  >
                    {parchiBill.length > 0 ? "Send Digital Bill to Customer 🚀" : "Add items to send bill"}
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

// Helper style for the + and - cart buttons
const cartBtnStyle = {
  width: '30px', 
  height: '30px', 
  borderRadius: '8px', 
  border: '1px solid #cbd5e1', 
  backgroundColor: '#f8fafc', 
  color: '#0f172a', 
  fontWeight: 'bold', 
  fontSize: '1.1rem', 
  cursor: 'pointer', 
  display: 'flex', 
  justifyContent: 'center', 
  alignItems: 'center'
};
                          

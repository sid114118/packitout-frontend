import React from 'react';

export default function ShopsTab({ 
  shops, 
  shopForm, 
  setShopForm, 
  handleAddShop, 
  handleEditShop, 
  openShopDrawer, 
  selectedShop, 
  setSelectedShop, 
  shopAnalysis, 
  loadingAnalysis 
}) {
  return (
    <div style={{ position: 'relative' }}>
      
      {/* --- MAIN GRID --- */}
      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '30px' }}>
        
        {/* LEFT: Add Shop Form */}
        <div style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>Register New Shop</h3>
          <form onSubmit={handleAddShop} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input type="text" placeholder="Shop Name" value={shopForm.name} onChange={e => setShopForm({...shopForm, name: e.target.value})} style={inputStyle} required />
            <input type="text" placeholder="Pincode" value={shopForm.pincode} onChange={e => setShopForm({...shopForm, pincode: e.target.value})} style={inputStyle} required />
            <input type="text" placeholder="Phone Number" value={shopForm.phone} onChange={e => setShopForm({...shopForm, phone: e.target.value})} style={inputStyle} required />
            <input type="text" placeholder="Password" value={shopForm.password} onChange={e => setShopForm({...shopForm, password: e.target.value})} style={inputStyle} required />
            <button type="submit" style={submitBtnStyle}>Register Partner</button>
          </form>
        </div>

        {/* RIGHT: Registered Shops List */}
        <div style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>Registered Shops ({shops.length})</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {shops.map(shop => (
              <div key={shop._id} style={{ border: '1px solid #e2e8f0', padding: '20px', borderRadius: '12px', backgroundColor: '#f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <h4 style={{ margin: '0 0 5px 0', color: '#0f172a' }}>{shop.name}</h4>
                  <span style={{ fontSize: '0.8rem', padding: '3px 8px', borderRadius: '12px', background: shop.isOpen ? '#d1fae5' : '#fee2e2', color: shop.isOpen ? '#059669' : '#b91c1c' }}>{shop.isOpen ? '🟢 Open' : '🔴 Closed'}</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', marginBottom: '15px' }}>📍 {shop.pincode} | 📞 {shop.phone}</p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => openShopDrawer(shop)} style={{ flex: 1, padding: '10px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>👁️ View Details</button>
                  <button onClick={() => handleEditShop(shop)} style={{ padding: '10px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer' }}>✏️ Edit</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- SLIDE OUT DRAWER OVERLAY --- */}
      {selectedShop && (
        <div onClick={() => setSelectedShop(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 }} />
      )}

      {/* --- SLIDE OUT DRAWER PANEL --- */}
      <div style={{
        position: 'fixed', top: 0, right: selectedShop ? 0 : '-450px', width: '400px', height: '100vh', 
        backgroundColor: 'white', zIndex: 1001, boxShadow: '-5px 0 20px rgba(0,0,0,0.1)', 
        transition: 'right 0.3s ease-in-out', display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ padding: '20px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, color: '#0f172a' }}>{selectedShop?.name}</h3>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Inventory Intelligence</span>
          </div>
          <button onClick={() => setSelectedShop(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>❌</button>
        </div>

        <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
          {loadingAnalysis ? <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: '50px' }}>Loading analysis...</p> : shopAnalysis ? (
            <>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
                <div style={{ flex: 1, backgroundColor: '#ecfdf5', padding: '15px', borderRadius: '10px', border: '1px solid #a7f3d0', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>{shopAnalysis.activeCount}</div>
                  <div style={{ fontSize: '0.7rem', color: '#059669', textTransform: 'uppercase', fontWeight: 'bold' }}>Active Items</div>
                </div>
                <div style={{ flex: 1, backgroundColor: '#fef2f2', padding: '15px', borderRadius: '10px', border: '1px solid #fecaca', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>{shopAnalysis.missingCount}</div>
                  <div style={{ fontSize: '0.7rem', color: '#b91c1c', textTransform: 'uppercase', fontWeight: 'bold' }}>Missing Items</div>
                </div>
              </div>

              <h4 style={{ color: '#0f172a', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>❌ Missing Revenue Opportunities</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
                
                {/* 🚀 FIXED: Completed the missing items list! */}
                {shopAnalysis.missingItems.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#f1f5f9', borderRadius: '8px', color: '#64748b' }}>
                    Perfect! This shop has every master item.
                  </div>
                ) : (
                  shopAnalysis.missingItems.map(item => (
                    <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                      <span style={{ fontWeight: 'bold' }}>{item.emoji} {item.name}</span>
                      <span style={{ color: '#64748b', fontSize: '0.9rem' }}>MRP: ₹{item.mrp}</span>
                    </div>
                  ))
                )}

              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// Styling Helpers for this component
const cardStyle = { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', height: 'fit-content' };
const inputStyle = { padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', width: '100%', boxSizing: 'border-box' };
const submitBtnStyle = { backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '5px' };

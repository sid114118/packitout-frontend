import React from 'react';

export default function ShopsTab({ shops, shopForm, setShopForm, handleShopSubmit, editingShopId, startEditingShop, cancelEditShop }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ color: '#0f172a', margin: 0 }}>
          {editingShopId ? "✏️ Edit Shop Partner" : "🏪 Register New Shop Partner"}
        </h3>
        {editingShopId && (
          <button onClick={cancelEditShop} style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Cancel Edit</button>
        )}
      </div>

      <form onSubmit={handleShopSubmit} style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '30px', border: editingShopId ? '2px solid #3b82f6' : 'none' }}>
        
        <h4 style={sectionTitleStyle}>1. Basic Login Details</h4>
        <div style={gridStyle}>
          <input required type="text" placeholder="Store Name (e.g., Gupta General Store)" value={shopForm.name} onChange={e => setShopForm({...shopForm, name: e.target.value})} style={inputStyle} />
          <input required type="text" placeholder="Phone Number (Login ID)" value={shopForm.phone} onChange={e => setShopForm({...shopForm, phone: e.target.value})} style={inputStyle} />
          <input required type="text" placeholder="Password" value={shopForm.password} onChange={e => setShopForm({...shopForm, password: e.target.value})} style={inputStyle} />
          <input type="text" placeholder="Store Image URL" value={shopForm.shopImage} onChange={e => setShopForm({...shopForm, shopImage: e.target.value})} style={inputStyle} />
        </div>

        <h4 style={sectionTitleStyle}>2. Location & Operations</h4>
        <div style={gridStyle}>
          <input required type="text" placeholder="Pincode" value={shopForm.pincode} onChange={e => setShopForm({...shopForm, pincode: e.target.value})} style={inputStyle} />
          <input type="text" placeholder="Operating Hours (e.g., 9AM - 10PM)" value={shopForm.operatingHours} onChange={e => setShopForm({...shopForm, operatingHours: e.target.value})} style={inputStyle} />
          <textarea placeholder="Full Store Address" value={shopForm.fullAddress} onChange={e => setShopForm({...shopForm, fullAddress: e.target.value})} style={{ ...inputStyle, gridColumn: '1 / -1', minHeight: '60px' }} />
        </div>

        <h4 style={sectionTitleStyle}>3. Legal & Compliance (Recommended)</h4>
        <div style={gridStyle}>
          <input type="text" placeholder="Owner Name" value={shopForm.ownerName} onChange={e => setShopForm({...shopForm, ownerName: e.target.value})} style={inputStyle} />
          <input type="text" placeholder="FSSAI License No." value={shopForm.fssai} onChange={e => setShopForm({...shopForm, fssai: e.target.value})} style={inputStyle} />
          <input type="text" placeholder="GST Number" value={shopForm.gst} onChange={e => setShopForm({...shopForm, gst: e.target.value})} style={inputStyle} />
          <input type="text" placeholder="PAN Number" value={shopForm.panNumber} onChange={e => setShopForm({...shopForm, panNumber: e.target.value})} style={inputStyle} />
        </div>

        <h4 style={sectionTitleStyle}>4. App Settings</h4>
        <div style={gridStyle}>
          <select value={shopForm.inventoryMode} onChange={e => setShopForm({...shopForm, inventoryMode: e.target.value})} style={inputStyle}>
            <option value="manual">Inventory Mode: Manual Toggle (In/Out of Stock)</option>
            <option value="stock_count">Inventory Mode: Strict Number Counting (SaaS Mode)</option>
          </select>
        </div>

        <button type="submit" style={{ width: '100%', padding: '15px', marginTop: '15px', backgroundColor: editingShopId ? '#3b82f6' : '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }}>
          {editingShopId ? "💾 Save Shop Updates" : "🏪 Register Shop Partner"}
        </button>
      </form>

      {/* SHOP PREVIEW CARDS */}
      <h3 style={{ color: '#0f172a', marginBottom: '15px' }}>Active Partners ({shops.length})</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
        {shops.map(shop => (
          <div key={shop._id} style={{ backgroundColor: 'white', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>{shop.name}</strong>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>📍 {shop.pincode} | 📞 {shop.phone}</div>
              <div style={{ margin: '10px 0', padding: '8px', backgroundColor: '#f8fafc', borderRadius: '6px', fontSize: '0.8rem', color: '#475569' }}>
                <div><strong>FSSAI:</strong> {shop.fssai || 'Not Provided'}</div>
                <div><strong>Inventory:</strong> {shop.inventoryMode === 'stock_count' ? '📊 Strict Count' : '🔘 Manual Toggle'}</div>
              </div>
            </div>
            <button onClick={() => startEditingShop(shop)} style={{ width: '100%', padding: '8px', backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
              ✏️ Edit Partner Info
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const sectionTitleStyle = { color: '#10b981', marginTop: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', fontSize: '1rem' };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' };
const inputStyle = { padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' };

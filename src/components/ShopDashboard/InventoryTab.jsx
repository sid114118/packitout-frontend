import React, { useState } from 'react';

export default function InventoryTab({ shopData, masterCatalog, handleInventoryUpdate }) {
  // --- STATES FOR SEARCH & EDITING ---
  const [searchMaster, setSearchMaster] = useState("");
  const [searchInventory, setSearchInventory] = useState("");
  
  // States for Inline Price Editing
  const [editingId, setEditingId] = useState(null);
  const [tempPrice, setTempPrice] = useState("");
  const [addingId, setAddingId] = useState(null); // For adding new items

  // --- DATA CALCULATIONS ---
  const shopProductIds = shopData.inventory?.filter(i => i.product).map(i => i.product._id) || []; 
  const availableToAdd = masterCatalog.filter(m => !shopProductIds.includes(m._id));

  // Apply Search Filters
  const filteredAvailable = availableToAdd.filter(item => item.name.toLowerCase().includes(searchMaster.toLowerCase()));
  const filteredInventory = shopData.inventory?.filter(item => item.product && item.product.name.toLowerCase().includes(searchInventory.toLowerCase())) || [];

  return (
    <div style={{ paddingBottom: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.3rem' }}>📦 Store Inventory</h3>
        <div style={{ fontSize: '0.85rem', color: '#64748b', backgroundColor: '#f1f5f9', padding: '6px 12px', borderRadius: '20px', fontWeight: 'bold' }}>
          {filteredInventory.length} Items Live
        </div>
      </div>

      {/* ========================================= */}
      {/* 🚀 ADD NEW PRODUCTS SECTION               */}
      {/* ========================================= */}
      <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#f0f9ff', borderRadius: '12px', border: '1px solid #bae6fd' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#0369a1', fontSize: '1.1rem' }}>➕ Add New Products to Store</h4>
        
        {/* Search Master Catalog */}
        <input 
          type="text" 
          placeholder="🔍 Search master catalog (e.g., Milk, Lay's)..." 
          value={searchMaster} 
          onChange={(e) => setSearchMaster(e.target.value)} 
          style={searchInputStyle} 
        />

        {availableToAdd.length === 0 ? (
          <div style={{ fontSize: '0.9rem', color: '#0284c7', marginTop: '10px', fontWeight: 'bold' }}>🎉 You have added every available product!</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px', marginTop: '10px', maxHeight: '250px', overflowY: 'auto' }}>
            {filteredAvailable.map(m => (
              <div key={m._id} style={{ backgroundColor: 'white', padding: '10px', borderRadius: '8px', border: '1px solid #bae6fd', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                
                {/* Product Info */}
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '24px', marginBottom: '5px' }}>{m.image ? <img src={m.image} alt="" style={{ height: '30px', objectFit: 'contain'}} /> : m.emoji}</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#0f172a', lineHeight: '1.2', height: '30px', overflow: 'hidden' }}>{m.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>MRP: ₹{m.mrp}</div>
                </div>

                {/* Inline Add Action */}
                {addingId === m._id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <input type="number" placeholder={`₹${m.mrp}`} value={tempPrice} onChange={e => setTempPrice(e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #0284c7', fontSize: '0.9rem', textAlign: 'center' }} autoFocus />
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button onClick={() => setAddingId(null)} style={{ flex: 1, padding: '6px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>❌</button>
                      <button onClick={() => { handleInventoryUpdate(m._id, tempPrice || m.mrp, true); setAddingId(null); setTempPrice(""); }} style={{ flex: 1, padding: '6px', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Save</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => { setAddingId(m._id); setTempPrice(m.mrp); }} style={{ width: '100%', padding: '6px', backgroundColor: '#e0f2fe', color: '#0284c7', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                    + Add to Store
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================= */}
      {/* 📦 EXISTING INVENTORY SECTION             */}
      {/* ========================================= */}
      <h4 style={{ margin: '0 0 10px 0', color: '#0f172a', fontSize: '1.1rem' }}>Active Store Inventory</h4>
      
      {/* Search Current Inventory */}
      <input 
        type="text" 
        placeholder="🔍 Search your store items..." 
        value={searchInventory} 
        onChange={(e) => setSearchInventory(e.target.value)} 
        style={{ ...searchInputStyle, marginBottom: '15px' }} 
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {filteredInventory.map(item => {
          if (!item.product) return null;
          const isOutOfStock = !item.inStock;

          return (
            <div key={item.product._id} style={{ ...cardStyle, border: isOutOfStock ? '2px solid #fecaca' : '1px solid #e2e8f0', opacity: isOutOfStock ? 0.8 : 1 }}>
              
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center', width: '100%' }}>
                {/* Image/Emoji */}
                <div style={{ width: '50px', height: '50px', backgroundColor: '#f8fafc', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>
                  {item.product.image ? <img src={item.product.image} style={{ maxWidth: '40px', maxHeight: '40px', objectFit: 'contain' }} alt="" /> : item.product.emoji}
                </div>

                {/* Details */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '0.95rem', lineHeight: '1.2' }}>{item.product.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '6px' }}>{item.product.qnty} • MRP ₹{item.product.mrp}</div>
                  
                  {/* Inline Price Editor */}
                  {editingId === item.product._id ? (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'bold', color: '#334155' }}>₹</span>
                      <input type="number" value={tempPrice} onChange={e => setTempPrice(e.target.value)} style={{ width: '70px', padding: '6px', borderRadius: '4px', border: '2px solid #10b981', outline: 'none', fontWeight: 'bold' }} autoFocus />
                      <button onClick={() => { handleInventoryUpdate(item.product._id, tempPrice, item.inStock); setEditingId(null); }} style={{ padding: '6px 12px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>Save</button>
                      <button onClick={() => setEditingId(null)} style={{ padding: '6px 10px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>❌</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: '900', color: '#10b981', fontSize: '1.1rem' }}>₹{item.sellingPrice}</span>
                      <button onClick={() => { setEditingId(item.product._id); setTempPrice(item.sellingPrice); }} style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold', padding: 0, textDecoration: 'underline' }}>
                        Edit Price
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 🔴🟢 MASSIVE OUT OF STOCK TOGGLE */}
              <button 
                onClick={() => handleInventoryUpdate(item.product._id, item.sellingPrice, !item.inStock)}
                style={{ width: '100%', marginTop: '15px', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', backgroundColor: item.inStock ? '#ecfdf5' : '#fef2f2', color: item.inStock ? '#059669' : '#dc2626', border: item.inStock ? '1px solid #10b981' : '1px solid #ef4444', transition: '0.2s' }}
              >
                {item.inStock ? "🟢 IN STOCK (Tap to Disable)" : "🔴 OUT OF STOCK (Tap to Enable)"}
              </button>

            </div>
          );
        })}
      </div>
    </div>
  );
}

// PREMIUM STYLING
const searchInputStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none', backgroundColor: 'white' };
const cardStyle = { backgroundColor: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', transition: '0.2s' };
                  

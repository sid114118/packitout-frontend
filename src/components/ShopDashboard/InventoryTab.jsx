import React from 'react';

export default function InventoryTab({ shopData, masterCatalog, handleInventoryUpdate }) {
  
  // We calculate what items are available to add right here inside the worker!
  const shopProductIds = shopData.inventory?.filter(i => i.product).map(i => i.product._id) || []; 
  const availableToAdd = masterCatalog.filter(m => !shopProductIds.includes(m._id));

  return (
    <div>
      <h3 style={{ marginTop: 0, color: '#0f172a' }}>Shop Inventory</h3>

      {/* 🚀 Add New Products UI */}
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e0f2fe', borderRadius: '12px' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#0369a1' }}>➕ Add New Products</h4>
        {availableToAdd.length === 0 ? (
          <div style={{ fontSize: '0.9rem', color: '#0ea5e9' }}>You have added all available products!</div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {availableToAdd.map(m => (
              <button 
                key={m._id} 
                onClick={() => {
                  const price = prompt(`Set selling price for ${m.name} (MRP: ₹${m.mrp})`, m.mrp);
                  if (price) handleInventoryUpdate(m._id, price, true);
                }}
                style={{ padding: '8px 12px', backgroundColor: 'white', border: '1px solid #bae6fd', borderRadius: '6px', cursor: 'pointer', color: '#0369a1', fontWeight: 'bold' }}
              >
                {m.emoji} {m.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* EXISTING INVENTORY */}
      <h4 style={{ margin: '0 0 10px 0', color: '#0f172a' }}>Current Items</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {shopData.inventory?.map(item => item.product && (
          <div key={item.product._id} style={cardStyle}>
            <div>
              <div style={{ fontWeight: 'bold' }}>{item.product.emoji} {item.product.name}</div>
              <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Selling for: ₹{item.sellingPrice}</div>
            </div>
            <button 
              onClick={() => {
                const newPrice = prompt(`Update price for ${item.product.name}`, item.sellingPrice);
                if (newPrice) handleInventoryUpdate(item.product._id, newPrice, item.inStock);
              }}
              style={{ padding: '8px 12px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}
            >
              Edit Price
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Styling kept inside the worker!
const cardStyle = { backgroundColor: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', marginBottom: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' };

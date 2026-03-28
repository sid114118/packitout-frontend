import React, { useState } from 'react';

export default function AdminParchiManager({ parchis, shops, onProcessOrder }) {
  const [selectedParchi, setSelectedParchi] = useState(null);
  const [billItems, setBillItems] = useState([]);

  // Find the specific shop's inventory so the Admin sees the right prices
  const targetShop = selectedParchi ? shops.find(s => s._id === selectedParchi.shopId) : null;

  const addToBill = (item) => {
    setBillItems(prev => {
      const exists = prev.find(i => i._id === item.product._id);
      if (exists) return prev.map(i => i._id === item.product._id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...item.product, price: item.sellingPrice || item.product.mrp, qty: 1 }];
    });
  };

  const submitFinalOrder = () => {
    onProcessOrder(selectedParchi, billItems);
    setSelectedParchi(null);
    setBillItems([]);
  };

  return (
    <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '12px' }}>
      <h3 style={{ marginTop: 0 }}>Global Parchi Queue 🛰️</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
        {parchis.map(p => {
          const shopName = shops.find(s => s._id === p.shopId)?.name || "Unknown Shop";
          return (
            <div key={p._id} style={{ border: '1px solid #e2e8f0', padding: '15px', borderRadius: '12px', backgroundColor: '#f8fafc' }}>
              <div style={{ fontWeight: 'bold' }}>{p.customerName}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Shop: <span style={{ color: '#3b82f6' }}>{shopName}</span></div>
              <button 
                onClick={() => setSelectedParchi(p)}
                style={{ marginTop: '10px', width: '100%', padding: '8px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Process for Shop ➡️
              </button>
            </div>
          );
        })}
      </div>

      {/* --- PROCESSING MODAL (REUSED LOGIC) --- */}
      {selectedParchi && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ backgroundColor: 'white', width: '95%', maxWidth: '900px', height: '85vh', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '15px', background: '#3b82f6', color: 'white', display: 'flex', justifyContent: 'space-between' }}>
              <strong>Admin Overdrive: Processing for {targetShop?.name}</strong>
              <button onClick={() => setSelectedParchi(null)} style={{ color: 'white', background: 'none', border: 'none', fontSize: '1.2rem' }}>✖</button>
            </div>
            
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              {/* IMAGE SIDE */}
              <div style={{ flex: 1, padding: '15px', overflowY: 'auto', background: '#f1f5f9' }}>
                <img src={selectedParchi.imageUrl} style={{ width: '100%', borderRadius: '8px' }} alt="list" />
              </div>

              {/* BILLING SIDE */}
              <div style={{ flex: 1, padding: '15px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                   <h4>Shop Inventory</h4>
                   <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                     {targetShop?.inventory?.map(i => (
                       <button onClick={() => addToBill(i)} style={{ padding: '5px 10px', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid #cbd5e1', cursor: 'pointer' }}>
                         {i.product?.name} (₹{i.sellingPrice})
                       </button>
                     ))}
                   </div>
                   <hr />
                   <h4>Final Bill Items</h4>
                   {billItems.map((bi, idx) => (
                     <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '5px' }}>
                       <span>{bi.name} x{bi.qty}</span>
                       <span>₹{bi.price * bi.qty}</span>
                     </div>
                   ))}
                </div>

                <div style={{ borderTop: '2px solid #eee', paddingTop: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '10px' }}>
                    <span>Total:</span>
                    <span>₹{billItems.reduce((s, i) => s + (i.price * i.qty), 0)}</span>
                  </div>
                  <button 
                    onClick={submitFinalOrder}
                    style={{ width: '100%', padding: '12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Send Final Bill as Admin 🚀
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

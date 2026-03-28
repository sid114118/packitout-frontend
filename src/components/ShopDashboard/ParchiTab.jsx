import React from 'react';

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
  return (
    <div>
      {/* --- PENDING PARCHI LIST --- */}
      <h3 style={{ marginTop: 0, color: '#0f172a' }}>Pending Parchi Lists</h3>
      
      {parchiRequests.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'white', borderRadius: '12px', color: '#94a3b8', border: '2px dashed #cbd5e1' }}>
          <span style={{ fontSize: '2.5rem' }}>📭</span><br/>No pending parchis right now.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {parchiRequests.map(req => (
            <div key={req._id} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '1.1rem' }}>{req.customerName || "Customer"}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Uploaded at {new Date(req.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
              <button 
                onClick={() => setSelectedParchi(req)}
                style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Process ➡️
              </button>
            </div>
          ))}
        </div>
      )}

      {/* --------------------------------------------------- */}
      {/* 🚀 THE SPLIT-SCREEN PARCHI PROCESSING MODAL         */}
      {/* --------------------------------------------------- */}
      {selectedParchi && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          
          <div style={{ backgroundColor: '#f8fafc', width: '100%', maxWidth: '1000px', height: '90vh', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
            
            <div style={{ padding: '15px 20px', backgroundColor: '#1e293b', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Processing Parchi for {selectedParchi.customerName || "Customer"}</h3>
              <button onClick={() => { setSelectedParchi(null); setParchiBill([]); }} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>✖</button>
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden', flexDirection: window.innerWidth < 768 ? 'column' : 'row' }}>
              
              {/* LEFT SIDE: Image */}
              <div style={{ flex: 1, borderRight: '2px solid #e2e8f0', backgroundColor: '#e2e8f0', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', overflowY: 'auto' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#475569' }}>Customer's List</h4>
                <img src={selectedParchi.imageUrl} alt="Parchi" style={{ maxWidth: '100%', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} />
              </div>

              {/* RIGHT SIDE: POS Register */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'white' }}>
                
                <div style={{ padding: '15px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f1f5f9', overflowY: 'auto', maxHeight: '40%' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#0f172a', fontSize: '0.9rem' }}>Tap items to add to bill:</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {shopData.inventory?.filter(i => i.product).map(item => (
                      <button 
                        key={item.product._id} 
                        onClick={() => handleAddToBill(item)}
                        style={{ padding: '8px 12px', backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', color: '#334155', display: 'flex', alignItems: 'center', gap: '5px' }}
                      >
                        {item.product.emoji} {item.product.name} (₹{item.sellingPrice || item.product.mrp})
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
                  <h4 style={{ margin: '0 0 15px 0', color: '#0f172a' }}>Generated Bill</h4>
                  {parchiBill.length === 0 ? (
                    <div style={{ color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic' }}>Tap items above to build the bill.</div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                      <tbody>
                        {parchiBill.map((item, index) => (
                          <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '10px 0' }}>{item.name}</td>
                            <td style={{ padding: '10px 0', textAlign: 'center' }}>x{item.qty}</td>
                            <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 'bold' }}>₹{item.price * item.qty}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div style={{ padding: '20px', backgroundColor: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '1.2rem', fontWeight: 'bold', color: '#0f172a' }}>
                    <span>Total Bill:</span>
                    <span>₹{parchiBill.reduce((sum, i) => sum + (i.price * i.qty), 0)}</span>
                  </div>
                  <button 
                    onClick={handleSendBill}
                    disabled={parchiBill.length === 0}
                    style={{ width: '100%', padding: '15px', backgroundColor: parchiBill.length > 0 ? '#10b981' : '#cbd5e1', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold', cursor: parchiBill.length > 0 ? 'pointer' : 'not-allowed' }}
                  >
                    {parchiBill.length > 0 ? "Send Bill to Customer 🚀" : "Add items to send"}
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

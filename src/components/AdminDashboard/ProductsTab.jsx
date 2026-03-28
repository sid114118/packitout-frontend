import React from 'react';

export default function ProductsTab({ products, form, setForm, handleAddProduct, CATEGORIES }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '30px' }}>
      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>Add Master Product</h3>
        <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input type="text" placeholder="Product Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={inputStyle} required />
          <input type="text" placeholder="Brand Name" value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} style={inputStyle} required />
          
          <select 
            value={form.category} 
            onChange={e => setForm({...form, category: e.target.value})} 
            style={{ ...inputStyle, cursor: 'pointer', appearance: 'auto' }} 
            required
          >
            <option value="" disabled>Select a Category...</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <div style={{ display: 'flex', gap: '10px' }}>
            <input type="number" placeholder="MRP" value={form.mrp} onChange={e => setForm({...form, mrp: e.target.value})} style={inputStyle} required />
            <input type="text" placeholder="Qty" value={form.qnty} onChange={e => setForm({...form, qnty: e.target.value})} style={inputStyle} required />
          </div>
          <input type="text" placeholder="Image URL (Real Photo)" value={form.image} onChange={e => setForm({...form, image: e.target.value})} style={inputStyle} />
          <input type="text" placeholder="Emoji (Backup)" value={form.emoji} onChange={e => setForm({...form, emoji: e.target.value})} style={inputStyle} />
          <button type="submit" style={submitBtnStyle}>Add to Database</button>
        </form>
      </div>
      
      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>Master List ({products.length})</h3>
        <table style={tableStyle}>
          <thead>
            <tr style={tableHeaderStyle}>
              <th>Preview</th><th>Product Details</th><th>Price</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p._id} style={{ borderBottom: '1px solid #f8fafc' }}>
                <td style={{ padding: '10px' }}>{p.image ? <img src={p.image} style={{ width: '40px', height: '40px', objectFit: 'contain' }} alt={p.name} /> : <span style={{fontSize: '24px'}}>{p.emoji}</span>}</td>
                <td style={{ padding: '10px' }}><strong>{p.name}</strong><br/><span style={{ fontSize: '0.8rem', color: '#64748b' }}>{p.brand} | {p.category}</span></td>
                <td style={{ padding: '10px' }}>₹{p.mrp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Styling Helpers for this component
const cardStyle = { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', height: 'fit-content' };
const inputStyle = { padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', width: '100%', boxSizing: 'border-box' };
const submitBtnStyle = { backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '5px' };
const tableStyle = { width: '100%', borderCollapse: 'collapse', textAlign: 'left' };
const tableHeaderStyle = { backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase' };

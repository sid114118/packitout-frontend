import React from 'react';

// Notice we brought in the new props!
export default function ProductsTab({ products, form, setForm, handleProductSubmit, CATEGORIES, editingProductId, startEditingProduct, cancelEdit }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ color: '#0f172a', margin: 0 }}>
          {editingProductId ? "✏️ Edit Product in Catalog" : "Add New Product to Master Catalog"}
        </h3>
        {editingProductId && (
          <button onClick={cancelEdit} style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            Cancel Edit
          </button>
        )}
      </div>
      
      {/* Form now calls handleProductSubmit */}
      <form onSubmit={handleProductSubmit} style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '30px', border: editingProductId ? '2px solid #3b82f6' : 'none' }}>
        
        {/* SECTION 1: Basic Info */}
        <h4 style={{ color: '#10b981', marginTop: 0, borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>1. Basic Information</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
          <input required type="text" placeholder="Product Name (e.g., Maggi Masala)" value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={inputStyle} />
          <input required type="text" placeholder="Brand (e.g., Nestle)" value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} style={inputStyle} />
          <select required value={form.category} onChange={e => setForm({...form, category: e.target.value})} style={inputStyle}>
            <option value="">Select Category</option>
            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <input required type="number" placeholder="MRP (₹)" value={form.mrp} onChange={e => setForm({...form, mrp: e.target.value})} style={inputStyle} />
          <input required type="text" placeholder="Unit/Quantity (e.g., 70g)" value={form.qnty} onChange={e => setForm({...form, qnty: e.target.value})} style={inputStyle} />
          <input type="text" placeholder="Image URL (Optional)" value={form.image} onChange={e => setForm({...form, image: e.target.value})} style={inputStyle} />
          <input type="text" placeholder="Emoji Fallback (e.g., 🍜)" value={form.emoji} onChange={e => setForm({...form, emoji: e.target.value})} style={inputStyle} />
          <input type="text" placeholder="Search Tags (comma separated)" value={form.searchTags} onChange={e => setForm({...form, searchTags: e.target.value})} style={inputStyle} />
        </div>

        {/* SECTION 2: Premium Details */}
        <h4 style={{ color: '#10b981', marginTop: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>2. Product Details (Shows in Modal)</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px', marginBottom: '20px' }}>
          <textarea placeholder="Detailed Description (What is it, how to use it...)" value={form.description} onChange={e => setForm({...form, description: e.target.value})} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} />
          <input type="text" placeholder="Manufacturer Info (Company Name & Address)" value={form.manufacturer} onChange={e => setForm({...form, manufacturer: e.target.value})} style={inputStyle} />
        </div>

        {/* SECTION 3: Nutritional Info */}
        <h4 style={{ color: '#10b981', marginTop: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>3. Nutritional Info (Per 100g)</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px', marginBottom: '25px' }}>
          <input type="text" placeholder="Energy (e.g., 350 kcal)" value={form.energy} onChange={e => setForm({...form, energy: e.target.value})} style={inputStyle} />
          <input type="text" placeholder="Protein (e.g., 8.5g)" value={form.protein} onChange={e => setForm({...form, protein: e.target.value})} style={inputStyle} />
          <input type="text" placeholder="Carbs (e.g., 55g)" value={form.carbs} onChange={e => setForm({...form, carbs: e.target.value})} style={inputStyle} />
          <input type="text" placeholder="Total Sugar (e.g., 22g)" value={form.sugar} onChange={e => setForm({...form, sugar: e.target.value})} style={inputStyle} />
          <input type="text" placeholder="Fat (e.g., 11g)" value={form.fat} onChange={e => setForm({...form, fat: e.target.value})} style={inputStyle} />
        </div>

        <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: editingProductId ? '#3b82f6' : '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }}>
          {editingProductId ? "💾 Save Changes" : "➕ Save Product to Database"}
        </button>
      </form>

      {/* PRODUCT LIST PREVIEW */}
      <h3 style={{ color: '#0f172a', marginBottom: '15px' }}>Current Master Catalog ({products.length})</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
        {products.map(p => (
          <div key={p._id} style={{ backgroundColor: 'white', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ fontSize: '2rem' }}>{p.image ? <img src={p.image} style={{ width: '40px', height: '40px', objectFit: 'contain' }} alt="" /> : p.emoji}</div>
                <div>
                  <strong style={{ display: 'block', color: '#0f172a' }}>{p.name}</strong>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{p.brand} • {p.qnty}</span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <span style={{ fontWeight: 'bold', color: '#10b981' }}>₹{p.mrp}</span>
                <span style={{ fontSize: '0.75rem', backgroundColor: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', color: '#475569' }}>{p.category}</span>
              </div>
            </div>
            {/* 👇 THE NEW EDIT BUTTON 👇 */}
            <button 
              onClick={() => startEditingProduct(p)} 
              style={{ width: '100%', padding: '8px', backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
              ✏️ Edit Product
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const inputStyle = { padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' };

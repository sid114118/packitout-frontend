import React, { useState, useMemo } from 'react';
import { useToast } from '../../ui/DialogProvider.jsx';
import { cdnImage } from '../../utils/cloudinaryUrl.js';
import { adminFetch } from '../../utils/api.js';

export default function ProductsTab({ products, form, setForm, handleProductSubmit, CATEGORIES, editingProductId, startEditingProduct, cancelEdit, onProductsChanged }) {
  const toast = useToast();

  // 🌟 BULK UPLOAD STATES
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // ⚖️ CREATE VARIANT STATES
  const [variantModalProduct, setVariantModalProduct] = useState(null);
  const [variantForm, setVariantForm] = useState({
    qnty: "",
    mrp: "",
    name: "",
    barcode: "",
    useCustomImage: false,
    customImageUrl: "",
    imageFile: null,
    imagePreview: ""
  });
  const [isSubmittingVariant, setIsSubmittingVariant] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleOpenVariantModal = (p) => {
    setVariantModalProduct(p);
    setVariantForm({
      qnty: "",
      mrp: p.mrp ? String(p.mrp) : "",
      name: p.name || "",
      barcode: "",
      useCustomImage: false,
      customImageUrl: "",
      imageFile: null,
      imagePreview: ""
    });
  };

  const handleVariantQntyChange = (newQnty) => {
    setVariantForm(prev => {
      let updatedName = prev.name;
      if (variantModalProduct) {
        const base = variantModalProduct.name || "";
        const oldQ = variantModalProduct.qnty || "";
        if (oldQ && base.toLowerCase().includes(oldQ.toLowerCase())) {
          updatedName = base.replace(new RegExp(oldQ.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), newQnty);
        } else if (newQnty) {
          updatedName = `${base} ${newQnty}`.trim();
        }
      }
      return { ...prev, qnty: newQnty, name: updatedName };
    });
  };

  const handleVariantImageFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const preview = URL.createObjectURL(f);
    setVariantForm(prev => ({
      ...prev,
      imageFile: f,
      imagePreview: preview,
      useCustomImage: true
    }));
  };

  const handleSubmitVariant = async (e) => {
    e.preventDefault();
    if (!variantForm.qnty.trim()) {
      return toast("Please enter pack size or quantity (e.g. 500g, 1L, 250ml)", "warn");
    }
    const mrpNum = Number(variantForm.mrp);
    if (!Number.isFinite(mrpNum) || mrpNum <= 0) {
      return toast("Please enter a valid MRP", "warn");
    }

    setIsSubmittingVariant(true);
    try {
      let finalImageUrl = "";
      if (variantForm.useCustomImage) {
        if (variantForm.imageFile) {
          setIsUploadingImage(true);
          const formData = new FormData();
          formData.append("image", variantForm.imageFile);
          const uploadRes = await adminFetch("/master-products/upload-image", {
            method: "POST",
            body: formData
          });
          const uploadData = await uploadRes.json();
          if (!uploadRes.ok) throw new Error(uploadData.error || "Failed to upload image");
          finalImageUrl = uploadData.url;
        } else if (variantForm.customImageUrl.trim()) {
          finalImageUrl = variantForm.customImageUrl.trim();
        }
      }

      const res = await adminFetch("/master-products/add-variant", {
        method: "POST",
        body: JSON.stringify({
          baseProductId: variantModalProduct._id,
          qnty: variantForm.qnty.trim(),
          mrp: mrpNum,
          name: variantForm.name.trim() || variantModalProduct.name,
          barcode: variantForm.barcode.trim(),
          image: finalImageUrl || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create variant");
      }

      toast(`🎉 Variant "${data.product.name}" created successfully!`);
      setVariantModalProduct(null);
      if (onProductsChanged) onProductsChanged();
    } catch (err) {
      console.error(err);
      toast(err.message || "Failed to create variant", "error");
    } finally {
      setIsSubmittingVariant(false);
      setIsUploadingImage(false);
    }
  };

  // 🚀 PAGINATION & SEARCH FOR 10,000+ CATALOG ITEMS
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState('All');
  const [visibleCount, setVisibleCount] = useState(48);

  // Helper function to handle the multi-select dropdowns for related/substitute products
  const handleMultiSelect = (e, fieldName) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setForm({ ...form, [fieldName]: selectedOptions });
  };

  // Cap select options so 10,000+ products don't render 20,000 <option> DOM nodes
  const selectableProducts = useMemo(() => {
    const selectedIds = new Set([...(form.relatedProducts || []), ...(form.substitutes || [])].map(String));
    const currentCat = (form.category || '').toLowerCase();
    const out = [];
    for (const p of (products || [])) {
      if (!p || p._id === editingProductId) continue;
      if (selectedIds.has(String(p._id))) {
        out.unshift(p);
      } else if (!currentCat || (p.category || '').toLowerCase() === currentCat) {
        if (out.length < 150) out.push(p);
      }
    }
    if (out.length < 100) {
      for (const p of (products || [])) {
        if (!p || p._id === editingProductId || out.includes(p)) continue;
        out.push(p);
        if (out.length >= 150) break;
      }
    }
    return out;
  }, [products, editingProductId, form.category, form.relatedProducts, form.substitutes]);

  const filteredCatalog = useMemo(() => {
    const q = catalogSearch.trim().toLowerCase();
    const tokens = q ? q.split(/\s+/).filter(Boolean) : [];
    return (products || []).filter(p => {
      if (!p) return false;
      if (catalogCategory !== 'All' && String(p.category || '').toLowerCase() !== catalogCategory.toLowerCase()) return false;
      if (tokens.length === 0) return true;
      const tagsStr = Array.isArray(p.searchTags) ? p.searchTags.join(' ') : (p.searchTags || '');
      const hay = `${p.name || ''} ${p.brand || ''} ${p.category || ''} ${p.qnty || ''} ${p.barcode || ''} ${tagsStr}`.toLowerCase();
      return tokens.every(t => hay.includes(t));
    });
  }, [products, catalogSearch, catalogCategory]);

  // 🚀 THE BULK UPLOAD HANDLER
  const handleBulkUpload = async () => {
    if (!file) {
      toast('Please select a CSV file first! 📁', 'warn');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const response = await adminFetch(`/master-products/bulk-upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        toast(data.message || 'Upload complete!');
        setFile(null);
        if (onProductsChanged) onProductsChanged();
      } else {
        toast(data.error || 'Upload failed', 'error');
      }
    } catch (err) {
      console.error(err);
      toast('Upload failed. Please check your connection or server.', 'error');
    }
    setUploading(false);
  };

  return (
    <div>
      {/* 📦 THE NEW BULK UPLOAD SECTION */}
      {!editingProductId && (
        <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '2px dashed #cbd5e1', marginBottom: '30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h4 style={{ margin: '0 0 5px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ⚡ Fast-Track: Bulk CSV Upload
            </h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Upload hundreds of master products at once. Ensure columns match the database schema.</p>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input 
              type="file" 
              accept=".csv" 
              onChange={(e) => setFile(e.target.files[0])} 
              style={{ padding: '8px', backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
            />
            <button 
              onClick={handleBulkUpload} 
              disabled={uploading}
              style={{ backgroundColor: uploading ? '#94a3b8' : '#0f172a', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: uploading ? 'not-allowed' : 'pointer', fontWeight: 'bold', transition: '0.2s' }}>
              {uploading ? '⏳ Uploading...' : '🚀 Upload CSV'}
            </button>
          </div>
        </div>
      )}

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
      
      <form onSubmit={handleProductSubmit} style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '30px', border: editingProductId ? '2px solid #3b82f6' : 'none' }}>
        
        {/* SECTION 1: Basic Info */}
        <h4 style={{ color: '#10b981', marginTop: 0, borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>1. Basic Information</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
          <input required type="text" placeholder="Product Name (e.g., Maggi Masala)" value={form.name || ""} onChange={e => setForm({...form, name: e.target.value})} style={inputStyle} />
          <input required type="text" placeholder="Brand (e.g., Nestle)" value={form.brand || ""} onChange={e => setForm({...form, brand: e.target.value})} style={inputStyle} />
          <select required value={form.category || ""} onChange={e => setForm({...form, category: e.target.value})} style={inputStyle}>
            <option value="">Select Category</option>
            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <input required type="number" placeholder="MRP (₹)" value={form.mrp || ""} onChange={e => setForm({...form, mrp: e.target.value})} style={inputStyle} />
          <input required type="text" placeholder="Unit/Quantity (e.g., 70g)" value={form.qnty || ""} onChange={e => setForm({...form, qnty: e.target.value})} style={inputStyle} />
          <input type="text" placeholder="Image URL (Optional)" value={form.image || ""} onChange={e => setForm({...form, image: e.target.value})} style={inputStyle} />
          <input type="text" placeholder="Emoji Fallback (e.g., 🍜)" value={form.emoji || ""} onChange={e => setForm({...form, emoji: e.target.value})} style={inputStyle} />
          <input type="text" placeholder="Search Tags (comma separated)" value={form.searchTags || ""} onChange={e => setForm({...form, searchTags: e.target.value})} style={inputStyle} />
        </div>

        {/* SECTION 2: Premium Details */}
        <h4 style={{ color: '#10b981', marginTop: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>2. Product Details</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px', marginBottom: '20px' }}>
          <textarea placeholder="Detailed Description (What is it, how to use it...)" value={form.description || ""} onChange={e => setForm({...form, description: e.target.value})} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} />
          <input type="text" placeholder="Manufacturer Info (Company Name & Address)" value={form.manufacturer || ""} onChange={e => setForm({...form, manufacturer: e.target.value})} style={inputStyle} />
        </div>

        {/* SECTION 3: Nutritional Info */}
        <h4 style={{ color: '#10b981', marginTop: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>3. Nutritional Info (Per 100g)</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px', marginBottom: '25px' }}>
          <input type="text" placeholder="Energy (e.g., 350 kcal)" value={form.energy || ""} onChange={e => setForm({...form, energy: e.target.value})} style={inputStyle} />
          <input type="text" placeholder="Protein (e.g., 8.5g)" value={form.protein || ""} onChange={e => setForm({...form, protein: e.target.value})} style={inputStyle} />
          <input type="text" placeholder="Carbs (e.g., 55g)" value={form.carbs || ""} onChange={e => setForm({...form, carbs: e.target.value})} style={inputStyle} />
          <input type="text" placeholder="Total Sugar (e.g., 22g)" value={form.sugar || ""} onChange={e => setForm({...form, sugar: e.target.value})} style={inputStyle} />
          <input type="text" placeholder="Fat (e.g., 11g)" value={form.fat || ""} onChange={e => setForm({...form, fat: e.target.value})} style={inputStyle} />
        </div>

        {/* 👇 SECTION 4: THE NEW PRO FEATURES 👇 */}
        <h4 style={{ color: '#3b82f6', marginTop: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>🌟 4. Pro Features (Variants & Cross-Selling)</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '25px' }}>
          
          {/* Item Group ID for Variants */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', fontWeight: 'bold', color: '#475569' }}>Item Group ID (For Sizes)</label>
            <input type="text" placeholder="e.g., COKE_ORIGINAL" value={form.itemGroupId || ""} onChange={e => setForm({...form, itemGroupId: e.target.value})} style={inputStyle} />
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Give exact same ID to different sizes (250ml, 750ml) to group them.</span>
          </div>

          {/* Related Products (Cross-Sell) */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', fontWeight: 'bold', color: '#475569' }}>Frequently Bought Together</label>
            <select multiple value={form.relatedProducts || []} onChange={(e) => handleMultiSelect(e, 'relatedProducts')} style={{...inputStyle, height: '100px'}}>
              {selectableProducts.map(p => (
                <option key={p._id} value={p._id}>{p.name} ({p.qnty})</option>
              ))}
            </select>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Hold Ctrl (Windows) or Cmd (Mac) to select multiple.</span>
          </div>

          {/* Substitutes */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', fontWeight: 'bold', color: '#475569' }}>Out of Stock Substitutes</label>
            <select multiple value={form.substitutes || []} onChange={(e) => handleMultiSelect(e, 'substitutes')} style={{...inputStyle, height: '100px'}}>
              {selectableProducts.map(p => (
                <option key={p._id} value={p._id}>{p.name} ({p.qnty})</option>
              ))}
            </select>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>If this is out of stock, recommend these instead.</span>
          </div>

        </div>

        <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: editingProductId ? '#3b82f6' : '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }}>
          {editingProductId ? "💾 Save Changes" : "➕ Save Product to Database"}
        </button>
      </form>

      {/* PRODUCT LIST PREVIEW WITH SEARCH, FILTER & PAGINATION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '15px' }}>
        <h3 style={{ color: '#0f172a', margin: 0 }}>
          Current Master Catalog ({filteredCatalog.length} of {products.length})
        </h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', flex: '1 1 360px', justifyContent: 'flex-end' }}>
          <input
            type="text"
            placeholder="🔍 Search catalog by name, brand, barcode, tag..."
            value={catalogSearch}
            onChange={(e) => { setCatalogSearch(e.target.value); setVisibleCount(48); }}
            style={{ ...inputStyle, maxWidth: '320px', backgroundColor: 'white' }}
          />
          <select
            value={catalogCategory}
            onChange={(e) => { setCatalogCategory(e.target.value); setVisibleCount(48); }}
            style={{ ...inputStyle, maxWidth: '220px', backgroundColor: 'white' }}
          >
            <option value="All">All Categories ({products.length})</option>
            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
        {filteredCatalog.slice(0, visibleCount).map(p => (
          <div key={p._id} style={{ backgroundColor: 'white', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ fontSize: '2rem' }}>{p.image ? <img src={cdnImage(p.image, 120)} loading="lazy" decoding="async" style={{ width: '40px', height: '40px', objectFit: 'contain' }} alt="" /> : p.emoji}</div>
                <div>
                  <strong style={{ display: 'block', color: '#0f172a' }}>{p.name}</strong>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{p.brand} • {p.qnty}</span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <span style={{ fontWeight: 'bold', color: '#10b981' }}>₹{p.mrp}</span>
                <span style={{ fontSize: '0.75rem', backgroundColor: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', color: '#475569' }}>{p.category}</span>
              </div>
              
              {/* Pro Feature Badges for Admin View */}
              {(p.itemGroupId || p.relatedProducts?.length > 0 || p.substitutes?.length > 0) && (
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  {p.itemGroupId && <span style={{ fontSize: '0.65rem', backgroundColor: '#dbeafe', color: '#1e3a8a', padding: '2px 6px', borderRadius: '4px' }}>🔗 Variant</span>}
                  {p.relatedProducts?.length > 0 && <span style={{ fontSize: '0.65rem', backgroundColor: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: '4px' }}>🤝 Cross-Sell</span>}
                  {p.substitutes?.length > 0 && <span style={{ fontSize: '0.65rem', backgroundColor: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: '4px' }}>🔄 Subs</span>}
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <button 
                type="button"
                onClick={() => startEditingProduct(p)} 
                style={{ flex: 1, padding: '8px', backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}>
                ✏️ Edit
              </button>
              <button 
                type="button"
                onClick={() => handleOpenVariantModal(p)} 
                style={{ flex: 1.3, padding: '8px', backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                ⚖️ Add Variant
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredCatalog.length > visibleCount && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            type="button"
            onClick={() => setVisibleCount(prev => prev + 48)}
            style={{
              padding: '12px 24px',
              backgroundColor: '#0f172a',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '0.95rem',
              cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
            }}
          >
            📥 Load More Products ({filteredCatalog.length - visibleCount} remaining)
          </button>
        </div>
      )}

      {/* ⚖️ CREATE PRODUCT VARIANT MODAL */}
      {variantModalProduct && (
        <div 
          onClick={() => !isSubmittingVariant && setVariantModalProduct(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(3px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div 
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              border: '1px solid #e2e8f0'
            }}
          >
            {/* Modal Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>⚖️</span> Create Product Variant
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Add different weight, size or pack to Master Catalog</span>
              </div>
              <button 
                type="button"
                disabled={isSubmittingVariant}
                onClick={() => setVariantModalProduct(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}
              >
                ×
              </button>
            </div>

            {/* Base Product Info Card */}
            <div style={{ padding: '16px 20px', backgroundColor: '#f0fdf4', borderBottom: '1px solid #bbf7d0', display: 'flex', gap: '14px', alignItems: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '10px', backgroundColor: 'white', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                {variantModalProduct.image ? (
                  <img src={cdnImage(variantModalProduct.image, 120)} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <span style={{ fontSize: '1.8rem' }}>{variantModalProduct.emoji || '📦'}</span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#166534', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Base Product
                </div>
                <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {variantModalProduct.name}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                  {variantModalProduct.brand} • Current: <b>{variantModalProduct.qnty || 'N/A'}</b> • MRP: <b>₹{variantModalProduct.mrp}</b>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitVariant} style={{ padding: '20px' }}>
              {/* Pack Size / Quantity */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                  New Pack Size / Weight <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. 250g, 500g, 1kg, 200ml, 1L, 5L"
                  value={variantForm.qnty}
                  onChange={e => handleVariantQntyChange(e.target.value)}
                  style={{ ...inputStyle, border: '2px solid #10b981' }}
                  autoFocus
                />
                {/* Quick suggestions pills */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                  {['100g', '200g', '250g', '500g', '1kg', '2kg', '5kg', '100ml', '200ml', '500ml', '1L', '2L', '5L'].map(size => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => handleVariantQntyChange(size)}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: variantForm.qnty.toLowerCase() === size.toLowerCase() ? '#10b981' : '#f8fafc',
                        color: variantForm.qnty.toLowerCase() === size.toLowerCase() ? 'white' : '#475569',
                        fontSize: '0.72rem',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* MRP & Barcode */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                    MRP (₹) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input 
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    placeholder="e.g. 120"
                    value={variantForm.mrp}
                    onChange={e => setVariantForm({ ...variantForm, mrp: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                    Barcode (Optional)
                  </label>
                  <input 
                    type="text"
                    placeholder="Scan or enter barcode"
                    value={variantForm.barcode}
                    onChange={e => setVariantForm({ ...variantForm, barcode: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Product Name */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                  Variant Display Name (Auto-suggested)
                </label>
                <input 
                  type="text" 
                  value={variantForm.name}
                  onChange={e => setVariantForm({ ...variantForm, name: e.target.value })}
                  style={inputStyle}
                />
                <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginTop: '4px' }}>
                  Derived from base product name with updated size.
                </span>
              </div>

              {/* Image Option */}
              <div style={{ marginBottom: '20px', padding: '14px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#334155', marginBottom: '8px' }}>
                  🖼️ Product Photo Option
                </label>

                {/* Radio 1: Reuse existing */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '10px', fontSize: '0.85rem', color: '#1e293b' }}>
                  <input 
                    type="radio" 
                    name="imageOption" 
                    checked={!variantForm.useCustomImage} 
                    onChange={() => setVariantForm({ ...variantForm, useCustomImage: false })} 
                  />
                  <span><b>Reuse base product photo</b> (Recommended if packaging looks same)</span>
                </label>

                {!variantForm.useCustomImage && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '24px', padding: '6px 12px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    {variantModalProduct.image ? (
                      <img src={cdnImage(variantModalProduct.image, 80)} alt="" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                    ) : (
                      <span>{variantModalProduct.emoji || '📦'}</span>
                    )}
                    <span style={{ fontSize: '0.78rem', color: '#166534', fontWeight: '600' }}>✓ Base image will be linked automatically</span>
                  </div>
                )}

                {/* Radio 2: Custom image */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '12px', marginBottom: '10px', fontSize: '0.85rem', color: '#1e293b' }}>
                  <input 
                    type="radio" 
                    name="imageOption" 
                    checked={variantForm.useCustomImage} 
                    onChange={() => setVariantForm({ ...variantForm, useCustomImage: true })} 
                  />
                  <span><b>Upload or use a different photo</b> (e.g. jar instead of pouch)</span>
                </label>

                {variantForm.useCustomImage && (
                  <div style={{ marginLeft: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleVariantImageFileChange}
                        style={{ fontSize: '0.82rem', padding: '6px', backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', flex: 1 }}
                      />
                      {variantForm.imagePreview && (
                        <img src={variantForm.imagePreview} alt="Preview" style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                      )}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Or enter Image URL directly:</div>
                    <input 
                      type="text" 
                      placeholder="https://... image URL"
                      value={variantForm.customImageUrl}
                      onChange={e => setVariantForm({ ...variantForm, customImageUrl: e.target.value })}
                      style={{ ...inputStyle, padding: '8px', fontSize: '0.82rem' }}
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  disabled={isSubmittingVariant}
                  onClick={() => setVariantModalProduct(null)}
                  style={{
                    padding: '10px 18px',
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingVariant}
                  style={{
                    padding: '10px 22px',
                    backgroundColor: isSubmittingVariant ? '#94a3b8' : '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '0.95rem',
                    cursor: isSubmittingVariant ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  {isSubmittingVariant ? (
                    <>
                      <div className="pio-spinner" style={{ width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      <span>{isUploadingImage ? 'Uploading Image...' : 'Creating Variant...'}</span>
                    </>
                  ) : (
                    <>
                      <span>⚖️</span>
                      <span>Create Variant</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = { padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' };

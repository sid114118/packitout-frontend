import React, { useState, useMemo, useEffect } from 'react';
import Fuse from 'fuse.js';
import { useToast, useConfirm, usePrompt } from '../../ui/DialogProvider.jsx';
import { cdnImage } from '../../utils/cloudinaryUrl.js';
import { shopFetch } from '../../utils/api.js';

const BASE_URL = (import.meta.env.VITE_API_BASE || "https://darkslategrey-snail-415133.hostingersite.com");

export default function InventoryTab({ shopData, masterCatalog, handleInventoryUpdate, handleInventoryRemove, onInventoryRefresh, fetchMasterCatalog }) {
  const toast = useToast();
  const confirmDialog = useConfirm();
  const askForValue = usePrompt();
  // --- STATES FOR SEARCH & EDITING ---
  const [searchMaster, setSearchMaster] = useState("");
  const [searchInventory, setSearchInventory] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [inventoryFilter, setInventoryFilter] = useState("all"); // 'all' | 'featured' | 'outOfStock'
  const [visibleCount, setVisibleCount] = useState(30);
  const [isUpdatingRank, setIsUpdatingRank] = useState(false);

  // Debounce search input to keep the browser responsive
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInventory);
      setVisibleCount(30);
    }, 150);
    return () => clearTimeout(handler);
  }, [searchInventory]);

  useEffect(() => {
    setVisibleCount(30);
  }, [inventoryFilter]);
  
  // States for Inline Price Editing
  const [editingId, setEditingId] = useState(null);
  const [tempPrice, setTempPrice] = useState("");
  const [addingId, setAddingId] = useState(null); 

  // 🚀 STATE FOR BULK IMPORT
  const [isImporting, setIsImporting] = useState(false);

  // 📝 STATE FOR CUSTOM PRODUCT
  const CATEGORIES = ["Dairy, Bread & Eggs", "Fruits & Veg", "Atta, Rice & Dal", "Chips & Namkeen", "Drinks & Juices", "Sweets & Chocolates", "Ice Creams", "Instant Food", "Bath & Body", "Health & Pharma"];
  const initialProductForm = { name: "", brand: "", category: "", mrp: "", qnty: "", emoji: "", image: "" };
  const [newProductForm, setNewProductForm] = useState(initialProductForm);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    
    const formData = new FormData();
    formData.append("image", file);
    
    try {
      const res = await shopFetch(shopData, "/master-products/upload-image", {
        method: "POST",
        body: formData
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Upload failed");
      }
      const data = await res.json();
      setNewProductForm(prev => ({ ...prev, image: data.url }));
      toast("Image uploaded successfully!");
    } catch (err) {
      console.error(err);
      toast(err.message, "error");
    } finally {
      setIsUploadingImage(false);
      e.target.value = null;
    }
  };

  const handleCreateMasterProduct = async (e) => {
    e.preventDefault();
    try {
      const res = await shopFetch(shopData, `/master-products`, {
        method: "POST",
        body: JSON.stringify(newProductForm),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        return toast(errData.error || "Failed to create custom product", 'error');
      }
      
      const createdProduct = await res.json();
      toast("Custom product added to Master Catalog and your Store!");
      setNewProductForm(initialProductForm);
      setIsCreatingProduct(false);

      if (fetchMasterCatalog) await fetchMasterCatalog();
      
      // Auto-add to inventory
      if (createdProduct && createdProduct._id) {
        await handleInventoryUpdate(createdProduct._id, createdProduct.mrp, true);
      }
    } catch (err) {
      console.error(err);
      toast("Failed to save custom product.", 'error');
    }
  };

  // 🛡️ SAFETY NETS
  const rawInventory = shopData?.inventory || [];
  const safeInventory = useMemo(() => {
    return rawInventory.filter(i => i && i.product && typeof i.product === 'object' && i.product._id);
  }, [rawInventory]);
  const safeCatalog = masterCatalog || [];

  // --- DATA CALCULATIONS ---
  const shopProductIds = safeInventory.map(i => i.product._id); 
  const availableToAdd = safeCatalog.filter(m => !shopProductIds.includes(m._id));

  // ⚡ FAST TOKENIZED MASTER CATALOG SEARCH
  const filteredAvailable = useMemo(() => {
    if (!searchMaster.trim()) return availableToAdd;
    const tokens = searchMaster.toLowerCase().trim().split(/\s+/);
    return availableToAdd.filter(m => {
      const text = `${m.name || ''} ${m.brand || ''} ${m.category || ''} ${Array.isArray(m.searchTags) ? m.searchTags.join(' ') : (m.searchTags || '')}`.toLowerCase();
      return tokens.every(t => text.includes(t));
    });
  }, [availableToAdd, searchMaster]);

  // ⚡ FAST TOKENIZED INVENTORY SEARCH WITH FILTER TABS
  const filteredInventory = useMemo(() => {
    let list = safeInventory;
    if (inventoryFilter === 'featured') {
      list = list.filter(i => i.isFeatured);
      // Sort featured items by featuredRank (lowest rank first, e.g. 1, 2, 3...)
      list = [...list].sort((a, b) => (Number(a.featuredRank ?? 999)) - (Number(b.featuredRank ?? 999)));
    } else if (inventoryFilter === 'outOfStock') {
      list = list.filter(i => !i.inStock);
    }

    if (!debouncedSearch.trim()) return list;

    const tokens = debouncedSearch.toLowerCase().trim().split(/\s+/);
    return list.filter(item => {
      const p = item.product;
      const text = `${p.name || ''} ${p.brand || ''} ${p.category || ''} ${Array.isArray(p.searchTags) ? p.searchTags.join(' ') : (p.searchTags || '')}`.toLowerCase();
      return tokens.every(t => text.includes(t));
    });
  }, [safeInventory, inventoryFilter, debouncedSearch]);

  const featuredCount = useMemo(() => safeInventory.filter(i => i.isFeatured).length, [safeInventory]);
  const outOfStockCount = useMemo(() => safeInventory.filter(i => !i.inStock).length, [safeInventory]);

  // ⭐ FEATURED RANK REORDER HANDLER
  const handleMoveRank = async (item, direction) => {
    const featuredList = [...safeInventory.filter(i => i.isFeatured)].sort((a, b) => (Number(a.featuredRank ?? 999)) - (Number(b.featuredRank ?? 999)));
    const currentIndex = featuredList.findIndex(f => f.product._id === item.product._id);
    if (currentIndex === -1) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= featuredList.length) return;

    // Swap items in featuredList
    const [moved] = featuredList.splice(currentIndex, 1);
    featuredList.splice(targetIndex, 0, moved);

    // Re-assign ranks 1..N
    const ranksPayload = featuredList.map((f, idx) => ({
      productId: f.product._id,
      featuredRank: idx + 1
    }));

    setIsUpdatingRank(true);
    try {
      const res = await shopFetch(shopData, `/shops/${shopData._id}/inventory/featured-ranks`, {
        method: 'POST',
        body: JSON.stringify({ ranks: ranksPayload })
      });
      if (res.ok) {
        toast(`Moved "${item.product.name}" to Rank #${targetIndex + 1}! ⭐`);
        if (onInventoryRefresh) await onInventoryRefresh();
      } else {
        toast('Failed to update rank', 'error');
      }
    } catch (e) {
      toast('Network error', 'error');
    } finally {
      setIsUpdatingRank(false);
    }
  };

  // ==========================================
  // ⚡ DYNAMIC BULK IMPORT FUNCTION
  // ==========================================
  const handleBulkImport = async () => {
    const shopId = shopData?._id;
    if (!shopId) {
      toast("Shop ID is missing!", 'error');
      return;
    }

    // 1. Ask the admin for a discount percentage
    const discountInput = await askForValue({
      title: 'Bulk Import Discount',
      message: 'Enter the discount percentage to apply to ALL master products (e.g., 5 for 5% off, or 0 for full MRP).',
      defaultValue: '5',
      placeholder: '0 - 100',
      inputMode: 'numeric',
      confirmText: 'Continue',
    });

    if (discountInput === null) return; // user cancelled

    const discountPercent = Number(discountInput);
    if (isNaN(discountPercent) || discountPercent < 0 || discountPercent > 100) {
      toast("Please enter a valid number between 0 and 100.", 'warn');
      return;
    }

    const confirmImport = await confirmDialog({
      title: 'Wipe & re-import inventory?',
      message: `This will erase your current inventory and import ALL master products at a ${discountPercent}% discount. This cannot be undone.`,
      confirmText: 'Yes, replace inventory',
      cancelText: 'Cancel',
      danger: true,
    });
    if (!confirmImport) return;

    setIsImporting(true);
    try {
      const response = await fetch(`${BASE_URL}/shops/${shopId}/bulk-import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discountPercent: discountPercent })
      });

      const data = await response.json();
      if (response.ok) {
        toast(data.message || 'Inventory imported!');
        if (onInventoryRefresh) await onInventoryRefresh();
      } else {
        toast(data.error || 'Import failed', 'error');
      }
    } catch (err) {
      toast("Network error. Could not reach the server.", 'error');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div style={{ paddingBottom: '30px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.3rem', fontWeight: '800' }}>📦 Store Inventory</h3>
        <div style={{ fontSize: '0.85rem', color: '#64748b', backgroundColor: '#f1f5f9', padding: '6px 12px', borderRadius: '20px', fontWeight: 'bold' }}>
          {filteredInventory.length} Items Live
        </div>
      </div>

      {/* ========================================= */}
      {/* 🛠️ CREATE CUSTOM PRODUCT SECTION            */}
      {/* ========================================= */}
      {shopData?.canAddMasterProducts && (
        <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#fdf4ff', borderRadius: '16px', border: '1px solid #f5d0fe' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h4 style={{ margin: 0, color: '#a21caf', fontSize: '1.1rem', fontWeight: '800' }}>✨ Create Custom Product</h4>
            <button 
              onClick={() => setIsCreatingProduct(!isCreatingProduct)}
              style={{ backgroundColor: '#a21caf', color: '#fff', padding: '6px 12px', borderRadius: '8px', border: 'none', fontWeight: '800', cursor: 'pointer' }}
            >
              {isCreatingProduct ? "Cancel" : "+ New Product"}
            </button>
          </div>

          {isCreatingProduct && (
            <form onSubmit={handleCreateMasterProduct} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
                <input required type="text" placeholder="Name (e.g. Local Bread)" value={newProductForm.name} onChange={e => setNewProductForm({...newProductForm, name: e.target.value})} style={searchInputStyle} />
                <input required type="text" placeholder="Brand" value={newProductForm.brand} onChange={e => setNewProductForm({...newProductForm, brand: e.target.value})} style={searchInputStyle} />
                <select required value={newProductForm.category} onChange={e => setNewProductForm({...newProductForm, category: e.target.value})} style={searchInputStyle}>
                  <option value="">Select Category</option>
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <input required type="number" placeholder="MRP (₹)" value={newProductForm.mrp} onChange={e => setNewProductForm({...newProductForm, mrp: e.target.value})} style={searchInputStyle} />
                <input required type="text" placeholder="Quantity (e.g. 1 unit)" value={newProductForm.qnty} onChange={e => setNewProductForm({...newProductForm, qnty: e.target.value})} style={searchInputStyle} />
                <input type="text" placeholder="Emoji (e.g. 🍞)" value={newProductForm.emoji} onChange={e => setNewProductForm({...newProductForm, emoji: e.target.value})} style={searchInputStyle} />
                <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                  <input type="text" placeholder="Image URL (Optional)" value={newProductForm.image} onChange={e => setNewProductForm({...newProductForm, image: e.target.value})} style={{ ...searchInputStyle, flex: 1, marginBottom: 0 }} />
                  <label style={{ cursor: isUploadingImage ? 'wait' : 'pointer', padding: '12px 10px', backgroundColor: '#e879f9', color: 'white', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', height: '100%' }}>
                    {isUploadingImage ? '⏳' : '📁 Upload'}
                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} disabled={isUploadingImage} />
                  </label>
                </div>
              </div>
              <button type="submit" style={{ padding: '12px', backgroundColor: '#a21caf', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '5px' }}>
                Save & Auto-Add to Store
              </button>
            </form>
          )}
        </div>
      )}

      {/* ========================================= */}
      {/* 🚀 ADD NEW PRODUCTS SECTION               */}
      {/* ========================================= */}
      <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#f0f9ff', borderRadius: '16px', border: '1px solid #bae6fd' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h4 style={{ margin: 0, color: '#0369a1', fontSize: '1.1rem', fontWeight: '800' }}>➕ Add New Products</h4>
          
          {/* ⚡ THE BULK IMPORT BUTTON ⚡ */}
          <button 
            onClick={handleBulkImport} 
            disabled={isImporting}
            style={{ 
              backgroundColor: '#0f172a', 
              color: '#fff', 
              padding: '8px 12px', 
              borderRadius: '8px', 
              fontWeight: '800', 
              fontSize: '0.8rem',
              border: 'none', 
              cursor: isImporting ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
            }}
          >
            {isImporting ? '⏳ Importing...' : '⚡ Bulk Import Catalog'}
          </button>
        </div>
        
        {/* Search Master Catalog */}
        <input 
          type="text" 
          placeholder="🔍 Search master catalog (e.g., Milk, Lay's)..." 
          value={searchMaster} 
          onChange={(e) => setSearchMaster(e.target.value)} 
          style={searchInputStyle} 
        />

        {availableToAdd.length === 0 ? (
          <div style={{ fontSize: '0.9rem', color: '#0284c7', marginTop: '15px', fontWeight: 'bold', textAlign: 'center' }}>🎉 You have added every available product!</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px', marginTop: '10px', maxHeight: '250px', overflowY: 'auto', paddingRight: '5px' }}>
            {filteredAvailable.map(m => (
              <div key={m._id} style={{ backgroundColor: 'white', padding: '10px', borderRadius: '12px', border: '1px solid #bae6fd', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                
                {/* Product Info */}
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '24px', marginBottom: '5px' }}>{m.image ? <img src={cdnImage(m.image, 100)} alt="" loading="lazy" decoding="async" style={{ height: '30px', objectFit: 'contain'}} /> : m.emoji}</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#0f172a', lineHeight: '1.2', height: '30px', overflow: 'hidden' }}>{m.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', fontWeight: '600' }}>MRP: ₹{m.mrp}</div>
                </div>

                {/* Inline Add Action */}
                {addingId === m._id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <input type="number" placeholder={`₹${m.mrp}`} value={tempPrice} onChange={e => setTempPrice(e.target.value)} style={{ padding: '6px', borderRadius: '6px', border: '2px solid #0284c7', outline: 'none', fontSize: '0.9rem', textAlign: 'center', fontWeight: 'bold' }} autoFocus />
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button onClick={() => setAddingId(null)} style={{ flex: 1, padding: '6px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>❌</button>
                      <button 
                        onClick={() => { 
                          handleInventoryUpdate(m._id, tempPrice || m.mrp, true); 
                          setAddingId(null); 
                          setTempPrice(""); 
                        }} 
                        style={{ flex: 1, padding: '6px', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => { setAddingId(m._id); setTempPrice(m.mrp); }} style={{ width: '100%', padding: '8px 6px', backgroundColor: '#e0f2fe', color: '#0284c7', border: 'none', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 12px 0', flexWrap: 'wrap', gap: '10px' }}>
        <h4 style={{ margin: 0, color: '#0f172a', fontSize: '1.15rem', fontWeight: '800' }}>Active Store Inventory</h4>
        <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>
          Showing {Math.min(visibleCount, filteredInventory.length)} of {filteredInventory.length}
        </div>
      </div>

      {/* 🏷️ FILTER PILLS FOR FAST GROUPING & FEATURED OVERVIEW */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '15px', overflowX: 'auto', paddingBottom: '4px' }}>
        <button
          onClick={() => setInventoryFilter('all')}
          style={{
            padding: '8px 14px',
            borderRadius: '20px',
            border: 'none',
            fontSize: '0.85rem',
            fontWeight: '700',
            cursor: 'pointer',
            backgroundColor: inventoryFilter === 'all' ? '#0f172a' : '#e2e8f0',
            color: inventoryFilter === 'all' ? '#fff' : '#475569',
            transition: '0.15s'
          }}
        >
          📦 All Items ({safeInventory.length})
        </button>
        <button
          onClick={() => setInventoryFilter('featured')}
          style={{
            padding: '8px 14px',
            borderRadius: '20px',
            border: 'none',
            fontSize: '0.85rem',
            fontWeight: '700',
            cursor: 'pointer',
            backgroundColor: inventoryFilter === 'featured' ? '#d97706' : '#fef3c7',
            color: inventoryFilter === 'featured' ? '#fff' : '#b45309',
            boxShadow: inventoryFilter === 'featured' ? '0 2px 8px rgba(217,119,6,0.3)' : 'none',
            transition: '0.15s'
          }}
        >
          ⭐ Featured Picks ({featuredCount})
        </button>
        <button
          onClick={() => setInventoryFilter('outOfStock')}
          style={{
            padding: '8px 14px',
            borderRadius: '20px',
            border: 'none',
            fontSize: '0.85rem',
            fontWeight: '700',
            cursor: 'pointer',
            backgroundColor: inventoryFilter === 'outOfStock' ? '#dc2626' : '#fee2e2',
            color: inventoryFilter === 'outOfStock' ? '#fff' : '#b91c1c',
            transition: '0.15s'
          }}
        >
          🔴 Out of Stock ({outOfStockCount})
        </button>
      </div>

      {inventoryFilter === 'featured' && (
        <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '10px 14px', marginBottom: '15px', fontSize: '0.85rem', color: '#92400e', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>💡</span>
          <span><strong>Shopkeeper's Picks Ranking:</strong> Use the ⬆️ and ⬇️ buttons below to order which item shows 1st, 2nd, etc. on the customer app home screen!</span>
        </div>
      )}
      
      {/* Search Current Inventory with Clear Button */}
      <div style={{ position: 'relative', marginBottom: '15px' }}>
        <input 
          type="text" 
          placeholder={`🔍 Search in ${inventoryFilter === 'featured' ? 'Featured Picks' : inventoryFilter === 'outOfStock' ? 'Out of Stock' : 'Store'}...`} 
          value={searchInventory} 
          onChange={(e) => setSearchInventory(e.target.value)} 
          style={{ ...searchInputStyle, paddingRight: searchInventory ? '40px' : '14px' }} 
        />
        {searchInventory && (
          <button 
            onClick={() => setSearchInventory('')}
            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', fontSize: '1rem', cursor: 'pointer', padding: '4px' }}
          >
            ✕
          </button>
        )}
      </div>

      {filteredInventory.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', backgroundColor: 'white', borderRadius: '16px', color: '#64748b', fontWeight: '600' }}>
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🔍</div>
          <div>No items match your {searchInventory ? 'search query' : 'selected filter'}.</div>
          {inventoryFilter !== 'all' && (
            <button 
              onClick={() => { setInventoryFilter('all'); setSearchInventory(''); }}
              style={{ marginTop: '12px', padding: '8px 16px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem' }}
            >
              View All Items
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {filteredInventory.slice(0, visibleCount).map((item, index) => {
            if (!item?.product) return null;
            const isOutOfStock = !item.inStock;
            const isFeaturedView = inventoryFilter === 'featured';

            return (
              <div key={item.product._id} style={{ ...cardStyle, border: item.isFeatured ? '2px solid #fde68a' : isOutOfStock ? '2px solid #fecaca' : '1px solid #e2e8f0', opacity: isOutOfStock ? 0.85 : 1, position: 'relative' }}>
                
                {/* 🌟 FEATURED RANK BADGE & REORDER CONTROLS */}
                {item.isFeatured && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fffbeb', padding: '6px 12px', borderRadius: '10px', marginBottom: '10px', border: '1px solid #fef3c7' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '1rem' }}>⭐</span>
                      <span style={{ fontWeight: '800', color: '#b45309', fontSize: '0.85rem' }}>
                        Shopkeeper Pick #{index + 1}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <button
                        title="Move Up in Shopkeeper's Picks"
                        disabled={isUpdatingRank || index === 0}
                        onClick={() => handleMoveRank(item, 'up')}
                        style={{
                          backgroundColor: index === 0 ? '#f1f5f9' : '#fef3c7',
                          color: index === 0 ? '#94a3b8' : '#b45309',
                          border: '1px solid #fde68a',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          cursor: (isUpdatingRank || index === 0) ? 'not-allowed' : 'pointer',
                          fontWeight: '800',
                          fontSize: '0.8rem'
                        }}
                      >
                        ⬆️
                      </button>
                      <button
                        title="Move Down in Shopkeeper's Picks"
                        disabled={isUpdatingRank || index === filteredInventory.length - 1}
                        onClick={() => handleMoveRank(item, 'down')}
                        style={{
                          backgroundColor: index === filteredInventory.length - 1 ? '#f1f5f9' : '#fef3c7',
                          color: index === filteredInventory.length - 1 ? '#94a3b8' : '#b45309',
                          border: '1px solid #fde68a',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          cursor: (isUpdatingRank || index === filteredInventory.length - 1) ? 'not-allowed' : 'pointer',
                          fontWeight: '800',
                          fontSize: '0.8rem'
                        }}
                      >
                        ⬇️
                      </button>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', width: '100%' }}>
                  {/* Image/Emoji */}
                  <div style={{ width: '56px', height: '56px', backgroundColor: '#f8fafc', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>
                    {item.product.image ? <img src={cdnImage(item.product.image, 150)} loading="lazy" decoding="async" style={{ maxWidth: '44px', maxHeight: '44px', objectFit: 'contain' }} alt="" /> : item.product.emoji}
                  </div>

                  {/* Details */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '0.95rem', lineHeight: '1.2' }}>{item.product.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '6px', fontWeight: '600' }}>{item.product.qnty} • MRP ₹{item.product.mrp}</div>
                    
                    {/* Inline Price Editor */}
                    {editingId === item.product._id ? (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold', color: '#334155' }}>₹</span>
                        <input type="number" value={tempPrice} onChange={e => setTempPrice(e.target.value)} style={{ width: '70px', padding: '6px', borderRadius: '6px', border: '2px solid #16a34a', outline: 'none', fontWeight: 'bold' }} autoFocus />
                        <button onClick={() => { handleInventoryUpdate(item.product._id, tempPrice, item.inStock); setEditingId(null); }} style={{ padding: '6px 12px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Save</button>
                        <button onClick={() => setEditingId(null)} style={{ padding: '6px 10px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>❌</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: '900', color: '#16a34a', fontSize: '1.1rem' }}>₹{item.sellingPrice}</span>
                        <button onClick={() => { setEditingId(item.product._id); setTempPrice(item.sellingPrice); }} style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '800', padding: 0, textDecoration: 'underline' }}>
                          Edit Price
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 🔴🟢 MASSIVE OUT OF STOCK & FEATURED TOGGLES */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                  <button 
                    onClick={() => handleInventoryUpdate(item.product._id, item.sellingPrice, !item.inStock)}
                    style={{ 
                      flex: 1, 
                      padding: '12px', 
                      borderRadius: '10px', 
                      fontWeight: '800', 
                      fontSize: '0.85rem', 
                      cursor: 'pointer', 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center', 
                      gap: '4px', 
                      backgroundColor: item.inStock ? '#f0fdf4' : '#fef2f2', 
                      color: item.inStock ? '#16a34a' : '#dc2626', 
                      border: item.inStock ? '1px solid #bbf7d0' : '1px solid #fecaca', 
                      transition: '0.2s',
                      boxShadow: item.inStock ? '0 4px 6px rgba(22, 163, 74, 0.05)' : 'none'
                    }}
                  >
                    {item.inStock ? "🟢 IN STOCK" : "🔴 OUT OF STOCK"}
                  </button>
                  <button 
                    onClick={() => {
                      const nextFeatured = !item.isFeatured;
                      const nextRank = nextFeatured ? (featuredCount + 1) : 999;
                      handleInventoryUpdate(item.product._id, item.sellingPrice, item.inStock, nextFeatured, nextRank);
                    }}
                    style={{ 
                      flex: 1, 
                      padding: '12px', 
                      borderRadius: '10px', 
                      fontWeight: '800', 
                      fontSize: '0.85rem', 
                      cursor: 'pointer', 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center', 
                      gap: '4px', 
                      backgroundColor: item.isFeatured ? '#fffbeb' : '#f8fafc', 
                      color: item.isFeatured ? '#d97706' : '#64748b', 
                      border: item.isFeatured ? '1px solid #fde68a' : '1px solid #e2e8f0', 
                      transition: '0.2s',
                    }}
                  >
                    {item.isFeatured ? "⭐ FEATURED" : "☆ FEATURE ITEM"}
                  </button>
                  <button
                    onClick={async () => {
                      if (await confirmDialog({ title: 'Remove Item?', message: 'Are you sure you want to remove this item from your store?', confirmText: 'Yes, Remove', danger: true })) {
                        handleInventoryRemove(item.product._id);
                      }
                    }}
                    style={{
                      padding: '12px 18px',
                      borderRadius: '10px',
                      fontWeight: '800',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      backgroundColor: '#fff1f2',
                      color: '#e11d48',
                      border: '1px solid #fecdd3',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    🗑️
                  </button>
                </div>

              </div>
            );
          })}

          {/* ⚡ LOAD MORE BUTTON (ELIMINATES BROWSER FREEZING/CRASHING) */}
          {filteredInventory.length > visibleCount && (
            <button
              onClick={() => setVisibleCount(prev => prev + 30)}
              style={{
                padding: '14px',
                borderRadius: '12px',
                backgroundColor: '#0f172a',
                color: '#fff',
                border: 'none',
                fontWeight: '800',
                fontSize: '0.95rem',
                cursor: 'pointer',
                marginTop: '10px',
                boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
              }}
            >
              📥 Load More Items ({filteredInventory.length - visibleCount} remaining)
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// PREMIUM STYLING
const searchInputStyle = { width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none', backgroundColor: 'white', fontWeight: '500' };
const cardStyle = { backgroundColor: 'white', padding: '16px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', transition: '0.2s' };
                               

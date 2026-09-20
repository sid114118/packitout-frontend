import React, { useState } from 'react';
import { useToast, useConfirm, usePrompt } from '../../ui/DialogProvider.jsx';
import { cdnImage } from '../../utils/cloudinaryUrl.js';

const BASE_URL = (import.meta.env.VITE_API_BASE || "https://darkslategrey-snail-415133.hostingersite.com");

export default function InventoryTab({ shopData, masterCatalog, handleInventoryUpdate, onInventoryRefresh }) {
  const toast = useToast();
  const confirmDialog = useConfirm();
  const askForValue = usePrompt();
  // --- STATES FOR SEARCH & EDITING ---
  const [searchMaster, setSearchMaster] = useState("");
  const [searchInventory, setSearchInventory] = useState("");
  
  // States for Inline Price Editing
  const [editingId, setEditingId] = useState(null);
  const [tempPrice, setTempPrice] = useState("");
  const [addingId, setAddingId] = useState(null); 

  // 🚀 STATE FOR BULK IMPORT
  const [isImporting, setIsImporting] = useState(false);

  // 🛡️ SAFETY NETS
  const safeInventory = shopData?.inventory || [];
  const safeCatalog = masterCatalog || [];

  // --- DATA CALCULATIONS ---
  const shopProductIds = safeInventory.filter(i => i?.product).map(i => i.product._id); 
  const availableToAdd = safeCatalog.filter(m => !shopProductIds.includes(m._id));

  // Apply Search Filters safely
  const filteredAvailable = availableToAdd.filter(item => 
    item?.name?.toLowerCase().includes(searchMaster.toLowerCase())
  );
  
  const filteredInventory = safeInventory.filter(item => 
    item?.product?.name?.toLowerCase().includes(searchInventory.toLowerCase())
  );

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
      <h4 style={{ margin: '0 0 10px 0', color: '#0f172a', fontSize: '1.1rem', fontWeight: '800' }}>Active Store Inventory</h4>
      
      {/* Search Current Inventory */}
      <input 
        type="text" 
        placeholder="🔍 Search your store items..." 
        value={searchInventory} 
        onChange={(e) => setSearchInventory(e.target.value)} 
        style={{ ...searchInputStyle, marginBottom: '15px' }} 
      />

      {filteredInventory.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px', backgroundColor: 'white', borderRadius: '16px', color: '#64748b', fontWeight: '600' }}>No items match your search.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {filteredInventory.map(item => {
            if (!item?.product) return null;
            const isOutOfStock = !item.inStock;

            return (
              <div key={item.product._id} style={{ ...cardStyle, border: isOutOfStock ? '2px solid #fecaca' : '1px solid #e2e8f0', opacity: isOutOfStock ? 0.8 : 1 }}>
                
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

                {/* 🔴🟢 MASSIVE OUT OF STOCK TOGGLE */}
                <button 
                  onClick={() => handleInventoryUpdate(item.product._id, item.sellingPrice, !item.inStock)}
                  style={{ 
                    width: '100%', 
                    marginTop: '15px', 
                    padding: '14px', 
                    borderRadius: '10px', 
                    fontWeight: '800', 
                    fontSize: '0.9rem', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    gap: '8px', 
                    backgroundColor: item.inStock ? '#f0fdf4' : '#fef2f2', 
                    color: item.inStock ? '#16a34a' : '#dc2626', 
                    border: item.inStock ? '1px solid #bbf7d0' : '1px solid #fecaca', 
                    transition: '0.2s',
                    boxShadow: item.inStock ? '0 4px 6px rgba(22, 163, 74, 0.05)' : 'none'
                  }}
                >
                  {item.inStock ? "🟢 IN STOCK (Tap to Disable)" : "🔴 OUT OF STOCK (Tap to Enable)"}
                </button>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// PREMIUM STYLING
const searchInputStyle = { width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none', backgroundColor: 'white', fontWeight: '500' };
const cardStyle = { backgroundColor: 'white', padding: '16px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', transition: '0.2s' };
                               

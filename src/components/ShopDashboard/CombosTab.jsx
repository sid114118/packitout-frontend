import React, { useState, useMemo } from 'react';
import { shopFetch } from '../../utils/api.js';
import { useToast } from '../../ui/DialogProvider.jsx';
import { cdnImage } from '../../utils/cloudinaryUrl.js';

export default function CombosTab({ shopData, masterCatalog, onComboRefresh }) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🎁');
  const [comboPrice, setComboPrice] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingComboId, setEditingComboId] = useState(null);

  // Helper to extract a normalized ID string
  const getItemId = (item) => {
    if (!item) return '';
    if (item.product && typeof item.product === 'object' && item.product._id) {
      return String(item.product._id);
    }
    if (item.product) return String(item.product);
    return String(item._id || '');
  };

  // Safe inventory items
  const availableInventory = useMemo(() => {
    return (shopData?.inventory || []).filter(i => i && i.inStock && i.product);
  }, [shopData]);

  // Filter available items for search
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return availableInventory.slice(0, 8);
    const tokens = searchTerm.toLowerCase().trim().split(/\s+/);
    return availableInventory.filter(item => {
      const prod = item.product || {};
      const text = `${prod.name || ''} ${prod.brand || ''} ${prod.category || ''}`.toLowerCase();
      return tokens.every(t => text.includes(t));
    }).slice(0, 15);
  }, [availableInventory, searchTerm]);

  // Multi-select toggle
  const handleToggleItem = (item) => {
    const pid = getItemId(item);
    if (!pid) return;

    setSelectedItems(prev => {
      const exists = prev.some(x => getItemId(x) === pid);
      if (exists) {
        return prev.filter(x => getItemId(x) !== pid);
      } else {
        return [...prev, item];
      }
    });
  };

  // Quick preset suggestions
  const PRESET_EMOJIS = ['🎁', '🪔', '☕', '🥪', '🍿', '🥗', '🍫', '🥛', '🎂', '🎉'];
  const PRESET_NAMES = [
    'Diwali Sweets Box 🪔',
    'Morning Breakfast Kit 🍳',
    'Chai & Biscuits Combo ☕',
    'Movie Night Munchies 🍿',
    'Quick Snacking Pack 🥪'
  ];

  // Pricing calculations
  const totalRegularPrice = useMemo(() => {
    return selectedItems.reduce((sum, item) => {
      const price = Number(item.sellingPrice || item.product?.mrp || 0);
      return sum + price;
    }, 0);
  }, [selectedItems]);

  const totalMrp = useMemo(() => {
    return selectedItems.reduce((sum, item) => {
      const mrp = Number(item.product?.mrp || item.sellingPrice || 0);
      return sum + mrp;
    }, 0);
  }, [selectedItems]);

  const effectiveComboPrice = comboPrice ? Number(comboPrice) : totalRegularPrice;
  const comboSavings = totalRegularPrice > effectiveComboPrice ? (totalRegularPrice - effectiveComboPrice) : 0;
  const comboDiscountPercent = totalRegularPrice > 0 && comboSavings > 0 
    ? Math.round((comboSavings / totalRegularPrice) * 100) 
    : 0;

  const handleCancelEdit = () => {
    setEditingComboId(null);
    setName('');
    setEmoji('🎁');
    setComboPrice('');
    setSelectedItems([]);
    setSearchTerm('');
  };

  const handleStartEdit = (combo) => {
    setEditingComboId(combo._id);
    setName(combo.name || '');
    setEmoji(combo.emoji || '🎁');
    setComboPrice(combo.comboPrice > 0 ? String(combo.comboPrice) : '');

    // Resolve combo productIds into selected items
    const comboPids = Array.isArray(combo.productIds) ? combo.productIds : [];
    const initialSelected = [];
    for (const p of comboPids) {
      const pidStr = (typeof p === 'object' && p?._id) ? String(p._id) : String(p);
      const found = availableInventory.find(inv => getItemId(inv) === pidStr);
      if (found) {
        initialSelected.push(found);
      } else if (typeof p === 'object' && p?._id) {
        initialSelected.push({
          product: p,
          sellingPrice: p.sellingPrice || p.mrp || 0,
          inStock: true
        });
      }
    }
    setSelectedItems(initialSelected);
    setSearchTerm('');

    // Smooth scroll to top form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateOrUpdateCombo = async (e) => {
    e.preventDefault();
    if (selectedItems.length < 2) {
      return toast('Select at least 2 products to make a combo offer!', 'warn');
    }
    if (!name.trim()) {
      return toast('Please enter a combo name', 'warn');
    }

    const productIds = selectedItems.map(i => getItemId(i)).filter(Boolean);
    if (productIds.length < 2) {
      return toast('Product IDs could not be resolved', 'error');
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        emoji: emoji || '🎁',
        productIds,
        comboPrice: comboPrice ? Number(comboPrice) : 0
      };

      const url = editingComboId 
        ? `/shops/${shopData._id}/combos/${editingComboId}`
        : `/shops/${shopData._id}/combos`;
      const method = editingComboId ? 'PUT' : 'POST';

      const response = await shopFetch(shopData, url, {
        method,
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (response.ok) {
        toast(editingComboId ? 'Combo updated successfully! 🎉' : 'Combo offer launched! 🎉');
        handleCancelEdit();
        if (onComboRefresh) await onComboRefresh();
      } else {
        toast(data.error || 'Failed to save combo', 'error');
      }
    } catch (err) {
      console.error(err);
      toast('Network error', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCombo = async (comboId) => {
    if (!window.confirm('Delete this combo offer? Customers will no longer see it.')) return;
    try {
      const response = await shopFetch(shopData, `/shops/${shopData._id}/combos/${comboId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        toast('Combo deleted ✅');
        if (editingComboId === comboId) handleCancelEdit();
        if (onComboRefresh) await onComboRefresh();
      } else {
        const data = await response.json().catch(() => ({}));
        toast(data.error || 'Failed to delete combo', 'error');
      }
    } catch (err) {
      toast('Network error', 'error');
    }
  };

  const currentCombos = shopData?.combos || [];

  return (
    <div style={{ paddingBottom: '30px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* HEADER BANNER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <div>
          <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.3rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🎁 Combo & Festival Offers
          </h3>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.85rem' }}>
            Bundle multiple products into 1-click deals (e.g. Diwali Boxes, Chai Kits) for customers.
          </p>
        </div>
        <div style={{ fontSize: '0.85rem', color: '#b45309', backgroundColor: '#fef3c7', padding: '6px 12px', borderRadius: '20px', fontWeight: 'bold' }}>
          {currentCombos.length} Active Combos
        </div>
      </div>

      {/* CREATE / EDIT COMBO FORM */}
      <div style={{ backgroundColor: '#ffffff', border: editingComboId ? '2px solid #f59e0b' : '1.5px solid #fde68a', borderRadius: '18px', padding: '20px', marginBottom: '30px', boxShadow: editingComboId ? '0 6px 20px rgba(245, 158, 11, 0.18)' : '0 4px 15px rgba(245, 158, 11, 0.08)' }}>
        {editingComboId ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', backgroundColor: '#fef3c7', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #fcd34d' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.5rem' }}>✏️</span>
              <div>
                <h4 style={{ margin: 0, color: '#92400e', fontSize: '1.05rem', fontWeight: '800' }}>
                  Editing Combo: {name || 'Untitled'}
                </h4>
                <span style={{ fontSize: '0.78rem', color: '#b45309' }}>
                  Modify products, adjust bundle price, or rename this combo pack
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCancelEdit}
              style={{ backgroundColor: '#fff', border: '1px solid #d97706', color: '#b45309', padding: '6px 14px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '800', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
            >
              Cancel Edit ✕
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <span style={{ fontSize: '1.4rem' }}>✨</span>
            <h4 style={{ margin: 0, color: '#b45309', fontSize: '1.1rem', fontWeight: '800' }}>Create New Combo Pack</h4>
          </div>
        )}

        <form onSubmit={handleCreateOrUpdateCombo} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* EMOJI & NAME INPUT */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                placeholder="🎁" 
                value={emoji} 
                onChange={e => setEmoji(e.target.value)} 
                maxLength={4}
                style={{ width: '64px', height: '48px', borderRadius: '12px', border: '1.5px solid #fcd34d', fontSize: '1.4rem', textAlign: 'center', backgroundColor: '#fffbeb', outline: 'none' }} 
              />
            </div>
            <input 
              type="text" 
              placeholder="Combo Name (e.g., Diwali Dhamaka Box, Chai Kit)" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              required
              style={{ flex: 1, minWidth: '220px', height: '48px', padding: '0 16px', borderRadius: '12px', border: '1.5px solid #fcd34d', fontSize: '0.95rem', fontWeight: '600', outline: 'none' }} 
            />
          </div>

          {/* QUICK PRESET CHIPS */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#78350f', fontWeight: '700' }}>Quick Presets:</span>
            {PRESET_NAMES.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setName(preset.replace(/[\p{Emoji}\u200d]+/gu, '').trim());
                  const foundEmoji = preset.match(/[\p{Emoji}\u200d]+/gu);
                  if (foundEmoji) setEmoji(foundEmoji[0]);
                }}
                style={{
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fde68a',
                  color: '#92400e',
                  fontSize: '0.75rem',
                  padding: '4px 10px',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                {preset}
              </button>
            ))}
          </div>

          {/* ITEM SELECTION STAGE */}
          <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h5 style={{ margin: 0, color: '#1e293b', fontSize: '0.95rem', fontWeight: '800' }}>
                Items in this Combo ({selectedItems.length})
              </h5>
              {selectedItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedItems([])}
                  style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                >
                  Clear all
                </button>
              )}
            </div>

            {/* SELECTED ITEMS THUMBNAILS TRAY */}
            {selectedItems.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
                {selectedItems.map(item => {
                  const pid = getItemId(item);
                  const prod = item.product || {};
                  const price = item.sellingPrice || prod.mrp || 0;
                  return (
                    <div 
                      key={pid} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        backgroundColor: '#ffffff', 
                        padding: '6px 10px 6px 6px', 
                        borderRadius: '12px', 
                        border: '1.5px solid #10b981', 
                        boxShadow: '0 2px 6px rgba(0,0,0,0.04)' 
                      }}
                    >
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                        {prod.image ? (
                          <img src={cdnImage(prod.image, 80)} alt="" style={{ maxWidth: '32px', maxHeight: '32px', objectFit: 'contain' }} />
                        ) : (
                          <span style={{ fontSize: '18px' }}>{prod.emoji || '📦'}</span>
                        )}
                      </div>
                      <div style={{ maxWidth: '120px' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {prod.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#16a34a' }}>
                          ₹{price}
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => handleToggleItem(item)} 
                        title="Remove"
                        style={{ background: '#fee2e2', border: 'none', color: '#dc2626', width: '22px', height: '22px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.75rem', marginLeft: '4px' }}
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '12px', backgroundColor: '#fffbeb', borderRadius: '10px', color: '#b45309', fontSize: '0.85rem', marginBottom: '12px', textAlign: 'center', fontWeight: '600' }}>
                💡 Select 2 or more products below to include in this combo.
              </div>
            )}

            {/* SEARCH BOX FOR INVENTORY */}
            <div style={{ position: 'relative', marginBottom: '10px' }}>
              <input 
                type="text" 
                placeholder="🔍 Search inventory to add (e.g. Milk, Bread, Lay's)..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                style={{ width: '100%', padding: '10px 36px 10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }} 
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.9rem' }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* PRODUCT SELECTOR GRID */}
            <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px', backgroundColor: '#fff' }}>
              {filteredItems.map(item => {
                const pid = getItemId(item);
                const prod = item.product || {};
                const isSelected = selectedItems.some(x => getItemId(x) === pid);
                const price = item.sellingPrice || prod.mrp || 0;

                return (
                  <div 
                    key={pid} 
                    onClick={() => handleToggleItem(item)}
                    style={{ 
                      padding: '8px 12px', 
                      borderBottom: '1px solid #f1f5f9', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      cursor: 'pointer', 
                      backgroundColor: isSelected ? '#ecfdf5' : '#ffffff',
                      transition: 'background-color 0.1s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                        {prod.image ? (
                          <img src={cdnImage(prod.image, 80)} alt="" style={{ maxWidth: '30px', maxHeight: '30px', objectFit: 'contain' }} />
                        ) : (
                          <span style={{ fontSize: '18px' }}>{prod.emoji || '📦'}</span>
                        )}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: isSelected ? '800' : '600', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {prod.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          {prod.qnty || ''} {prod.brand ? `• ${prod.brand}` : ''}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                      <span style={{ fontWeight: '800', color: '#16a34a', fontSize: '0.9rem' }}>₹{price}</span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleToggleItem(item); }}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: isSelected ? '1px solid #059669' : '1px solid #cbd5e1',
                          backgroundColor: isSelected ? '#10b981' : '#f8fafc',
                          color: isSelected ? '#fff' : '#475569',
                          fontWeight: '800',
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}
                      >
                        {isSelected ? '✓ Added' : '+ Add'}
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredItems.length === 0 && (
                <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                  No products found. Make sure items are marked in-stock in your inventory!
                </div>
              )}
            </div>
          </div>

          {/* PRICING & DISCOUNT CONFIGURATION */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', backgroundColor: '#fffbeb', padding: '14px', borderRadius: '12px', border: '1px solid #fde68a' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#92400e', fontWeight: '700', marginBottom: '4px' }}>
                Total Items Value (Regular)
              </label>
              <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#78350f' }}>
                ₹{totalRegularPrice}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#92400e', fontWeight: '700', marginBottom: '4px' }}>
                Special Combo Offer Price (₹)
              </label>
              <input 
                type="number" 
                placeholder={`e.g. ${totalRegularPrice > 20 ? totalRegularPrice - 20 : totalRegularPrice}`} 
                value={comboPrice} 
                onChange={e => setComboPrice(e.target.value)} 
                min={1}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #f59e0b', fontSize: '0.95rem', fontWeight: '800', outline: 'none', backgroundColor: '#fff' }} 
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#92400e', fontWeight: '700', marginBottom: '4px' }}>
                Customer Discount / Deal
              </label>
              {comboSavings > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ backgroundColor: '#10b981', color: '#fff', fontSize: '0.8rem', fontWeight: '800', padding: '3px 8px', borderRadius: '6px' }}>
                    {comboDiscountPercent}% OFF
                  </span>
                  <span style={{ fontSize: '0.85rem', color: '#047857', fontWeight: '700' }}>
                    Save ₹{comboSavings}
                  </span>
                </div>
              ) : (
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Standard bundle price</span>
              )}
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <button 
            type="submit" 
            disabled={isSubmitting || selectedItems.length < 2}
            style={{ 
              padding: '14px', 
              background: (isSubmitting || selectedItems.length < 2) 
                ? '#94a3b8' 
                : (editingComboId 
                    ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' 
                    : 'linear-gradient(135deg, #d97706 0%, #b45309 100%)'), 
              color: '#fff', 
              border: 'none', 
              borderRadius: '12px', 
              fontWeight: '800', 
              fontSize: '1rem',
              cursor: (isSubmitting || selectedItems.length < 2) ? 'not-allowed' : 'pointer',
              boxShadow: (selectedItems.length >= 2) 
                ? (editingComboId ? '0 4px 14px rgba(37, 99, 235, 0.35)' : '0 4px 14px rgba(217, 119, 6, 0.35)') 
                : 'none',
              transition: 'all 0.2s'
            }}
          >
            {isSubmitting 
              ? (editingComboId ? 'Saving Changes...' : 'Creating Combo...') 
              : (editingComboId 
                  ? `💾 Save Changes (${selectedItems.length} Products for ₹${effectiveComboPrice})` 
                  : `🚀 Launch Combo (${selectedItems.length} Products for ₹${effectiveComboPrice})`)}
          </button>
        </form>
      </div>

      {/* ACTIVE COMBOS LIST */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <h4 style={{ color: '#0f172a', margin: 0, fontSize: '1.15rem', fontWeight: '800' }}>
          Active Store Combos ({currentCombos.length})
        </h4>
        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
          Visible to all customers on your store's home screen
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
        {currentCombos.map(combo => {
          const comboProducts = Array.isArray(combo.productIds) ? combo.productIds : [];
          const hasDiscount = combo.comboPrice > 0;
          const isCurrentlyEditing = editingComboId === combo._id;

          return (
            <div 
              key={combo._id} 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between', 
                padding: '16px', 
                backgroundColor: isCurrentlyEditing ? '#fffbeb' : '#ffffff', 
                border: isCurrentlyEditing ? '2px solid #f59e0b' : '1.5px solid #fef08a', 
                borderRadius: '16px', 
                boxShadow: isCurrentlyEditing ? '0 6px 18px rgba(245, 158, 11, 0.2)' : '0 4px 12px rgba(0,0,0,0.03)',
                position: 'relative',
                transition: 'all 0.2s'
              }}
            >
              <div>
                {/* COMBO BADGE & NAME */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{combo.emoji || '🎁'}</span>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: '#0f172a' }}>
                        {combo.name}
                      </h4>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {comboProducts.length} items bundled
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    {isCurrentlyEditing && (
                      <span style={{ backgroundColor: '#f59e0b', color: '#fff', fontSize: '0.68rem', fontWeight: '800', padding: '2px 8px', borderRadius: '10px' }}>
                        EDITING NOW
                      </span>
                    )}
                    {hasDiscount && (
                      <span style={{ backgroundColor: '#fef08a', color: '#854d0e', fontSize: '0.7rem', fontWeight: '800', padding: '2px 8px', borderRadius: '10px' }}>
                        SPECIAL OFFER
                      </span>
                    )}
                  </div>
                </div>

                {/* INCLUDED PRODUCTS THUMBNAILS */}
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '6px 0 12px', borderBottom: '1px solid #f1f5f9' }}>
                  {comboProducts.map((p, idx) => {
                    const prodName = typeof p === 'object' ? p.name : 'Product';
                    const prodImg = typeof p === 'object' ? p.image : null;
                    const prodEmoji = typeof p === 'object' ? p.emoji : '📦';

                    return (
                      <div 
                        key={idx} 
                        title={prodName} 
                        style={{ 
                          width: '42px', 
                          height: '42px', 
                          borderRadius: '8px', 
                          backgroundColor: '#f8fafc', 
                          border: '1px solid #e2e8f0', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          overflow: 'hidden', 
                          flexShrink: 0 
                        }}
                      >
                        {prodImg ? (
                          <img src={cdnImage(prodImg, 80)} alt={prodName} style={{ maxWidth: '34px', maxHeight: '34px', objectFit: 'contain' }} />
                        ) : (
                          <span style={{ fontSize: '18px' }}>{prodEmoji}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* FOOTER: PRICE, EDIT & DELETE */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>Bundle Price</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: '900', color: '#16a34a' }}>
                    ₹{combo.comboPrice > 0 ? combo.comboPrice : 'Bundle'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button 
                    onClick={() => handleStartEdit(combo)}
                    style={{ 
                      backgroundColor: isCurrentlyEditing ? '#2563eb' : '#eff6ff', 
                      color: isCurrentlyEditing ? '#fff' : '#2563eb', 
                      border: '1px solid #bfdbfe', 
                      padding: '6px 12px', 
                      borderRadius: '8px', 
                      fontWeight: '700', 
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    ✏️ Edit
                  </button>

                  <button 
                    onClick={() => handleDeleteCombo(combo._id)}
                    style={{ 
                      backgroundColor: '#fee2e2', 
                      color: '#dc2626', 
                      border: 'none', 
                      padding: '6px 12px', 
                      borderRadius: '8px', 
                      fontWeight: '700', 
                      fontSize: '0.8rem',
                      cursor: 'pointer' 
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {currentCombos.length === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: '35px 20px', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '14px', border: '1px dashed #cbd5e1', color: '#64748b' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🎁</div>
            <div style={{ fontWeight: '700', color: '#334155' }}>No Combos Created Yet</div>
            <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>
              Create your first combo box above to delight customers with festival & grocery packs!
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

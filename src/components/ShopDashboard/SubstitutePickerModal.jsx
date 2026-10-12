import React, { useState, useMemo, useEffect } from 'react';
import { shopFetch, BASE_URL } from '../../utils/api.js';
import { cdnImage } from '../../utils/cloudinaryUrl.js';

export default function SubstitutePickerModal({
  open,
  order,
  itemIndex = null,
  mode = 'swap', // 'swap' | 'add'
  shopData,
  onClose,
  onProposalSent,
  onItemAdded,
}) {
  if (!open || !order) return null;

  const isAddMode = mode === 'add' || itemIndex === null || itemIndex === undefined;
  const originalItem = (!isAddMode && itemIndex !== null && itemIndex !== undefined)
    ? (order.items?.[itemIndex] || {})
    : null;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customQty, setCustomQty] = useState(originalItem?.qty || 1);
  const [submitting, setSubmitting] = useState(false);
  const [useCustom, setUseCustom] = useState(false);
  const [extraCatalog, setExtraCatalog] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  // 1. Extract products from shop's active inventory (has custom shop selling prices)
  const storeInventoryProducts = useMemo(() => {
    const raw = Array.isArray(shopData?.inventory) ? shopData.inventory : [];
    return raw
      .filter(i => i && i.product)
      .map(i => {
        const p = typeof i.product === 'object' ? i.product : {};
        return {
          _id: p._id || i._id,
          productId: p._id || i._id,
          name: p.name || 'Store Item',
          brand: p.brand || '',
          category: p.category || '',
          sellingPrice: Number(i.sellingPrice || p.sellingPrice || p.mrp || 0),
          price: Number(i.sellingPrice || p.sellingPrice || p.mrp || 0),
          mrp: Number(p.mrp || i.sellingPrice || 0),
          image: p.image || '',
          emoji: p.emoji || '🛒',
          qnty: p.qnty || '1 unit',
          inStock: i.inStock !== false,
          isStoreStock: true
        };
      });
  }, [shopData]);

  // 2. Fetch full catalog from /master-products so ANY requested item (Milk, Bread, Oil, etc.) is searchable
  useEffect(() => {
    if (!open) return;
    let isMounted = true;
    const fetchCatalog = async () => {
      try {
        setLoadingCatalog(true);
        const res = await fetch(`${BASE_URL}/master-products`);
        if (res.ok) {
          const list = await res.json();
          if (isMounted && Array.isArray(list)) {
            setExtraCatalog(list);
          }
        }
      } catch (e) {
        console.error('Failed to load master products catalog:', e);
      } finally {
        if (isMounted) setLoadingCatalog(false);
      }
    };
    fetchCatalog();
    return () => { isMounted = false; };
  }, [open]);

  // 3. Combined deduplicated catalog (Store items first, then Master catalog)
  const combinedCatalog = useMemo(() => {
    const map = new Map();
    // Store inventory items take top priority (contain store's specific selling prices)
    storeInventoryProducts.forEach(p => {
      if (p.name) map.set(p.name.toLowerCase().trim(), p);
    });
    // Add master catalog products if not already in store inventory
    extraCatalog.forEach(p => {
      const key = (p.name || '').toLowerCase().trim();
      if (key && !map.has(key)) {
        map.set(key, {
          _id: p._id,
          productId: p._id,
          name: p.name,
          brand: p.brand || '',
          category: p.category || '',
          sellingPrice: Number(p.mrp || 0),
          price: Number(p.mrp || 0),
          mrp: Number(p.mrp || 0),
          image: p.image || '',
          emoji: p.emoji || '🛒',
          qnty: p.qnty || '1 unit',
          inStock: true,
          isStoreStock: false
        });
      }
    });
    return Array.from(map.values());
  }, [storeInventoryProducts, extraCatalog]);

  // 4. Tokenized multi-word search across product name, brand, category
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const tokens = q.split(/\s+/).filter(Boolean);
      return combinedCatalog.filter(p => {
        const text = `${p.name || ''} ${p.brand || ''} ${p.category || ''}`.toLowerCase();
        return tokens.every(token => text.includes(token));
      }).slice(0, 25);
    }
    if (!isAddMode && originalItem?.name) {
      // Suggest substitutes that share keywords with original item
      const words = originalItem.name.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      if (words.length > 0) {
        const matches = combinedCatalog.filter(p => {
          const pName = (p.name || '').toLowerCase();
          return words.some(w => pName.includes(w));
        }).slice(0, 20);
        if (matches.length > 0) return matches;
      }
    }
    // Default top catalog items
    return combinedCatalog.slice(0, 20);
  }, [combinedCatalog, searchQuery, isAddMode, originalItem?.name]);

  const origQty = Number(originalItem?.qty) || 1;
  const origPrice = Number(originalItem?.sellingPrice || originalItem?.price || originalItem?.mrp || 0);
  const origTotal = origPrice * origQty;

  const effectiveItem = useMemo(() => {
    if (useCustom) {
      const p = Math.max(0, Number(customPrice) || 0);
      const q = Math.max(1, Number(customQty) || 1);
      return {
        name: customName.trim(),
        price: p,
        qty: q,
        image: '',
        brand: '',
      };
    }
    if (selectedProduct) {
      const p = Math.max(0, Number(selectedProduct.sellingPrice || selectedProduct.price || selectedProduct.mrp || 0));
      const q = Math.max(1, Number(customQty) || (isAddMode ? 1 : origQty));
      return {
        productId: selectedProduct.productId || selectedProduct._id,
        name: selectedProduct.name,
        brand: selectedProduct.brand || '',
        price: p,
        qty: q,
        image: selectedProduct.image || '',
      };
    }
    return null;
  }, [useCustom, customName, customPrice, customQty, selectedProduct, isAddMode, origQty]);

  const itemTotal = effectiveItem ? effectiveItem.price * effectiveItem.qty : 0;
  const priceDelta = isAddMode ? itemTotal : (itemTotal - origTotal);

  const handleSubmit = async () => {
    if (!effectiveItem || !effectiveItem.name || submitting) return;

    setSubmitting(true);
    try {
      if (isAddMode) {
        // ➕ ADD EXTRA ITEM TO ORDER
        const res = await shopFetch(shopData, `/orders/${order._id}/add-item`, {
          method: 'POST',
          body: JSON.stringify({
            productId: effectiveItem.productId,
            name: effectiveItem.name,
            brand: effectiveItem.brand,
            price: effectiveItem.price,
            qty: effectiveItem.qty,
            image: effectiveItem.image,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          alert(err.error || 'Failed to add item to order');
          return;
        }

        const data = await res.json();
        if (onProposalSent) onProposalSent(data.message);
        onClose();

      } else {
        // 🔄 PROPOSE ITEM SWAP / REPLACEMENT
        const res = await shopFetch(shopData, `/orders/${order._id}/propose-replacement`, {
          method: 'POST',
          body: JSON.stringify({
            originalItemIndex: itemIndex,
            replacementItem: effectiveItem,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          alert(err.error || 'Failed to send replacement proposal');
          return;
        }

        const data = await res.json();
        if (onProposalSent) onProposalSent(data.message);
        onClose();
      }
    } catch (err) {
      console.error('Submit proposal/item error:', err);
      alert('Network error while processing request.');
    } finally {
      setSubmitting(false);
    }
  };

  const shortId = (order._id || '').slice(-5).toUpperCase();

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.72)',
      backdropFilter: 'blur(4px)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '92vh',
        borderRadius: '20px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'scaleIn 0.2s ease-out'
      }}>
        <style>{`
          @keyframes scaleIn { from { transform: scale(0.96); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        `}</style>

        {/* Modal Header */}
        <div style={{
          backgroundColor: isAddMode ? '#065f46' : '#0f172a',
          color: '#ffffff',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900 }}>
              {isAddMode ? '➕ Add Extra Item to Order (नया सामान जोड़ें)' : '🔄 Propose Substitute (विकल्प चुनें)'}
            </h3>
            <div style={{ fontSize: '0.78rem', color: '#a7f3d0', marginTop: '2px' }}>
              Order #{shortId} {isAddMode ? '· Extra item requested in chat' : '· Replace out-of-stock item'}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'rgba(255,255,255,0.18)',
              border: 'none',
              color: '#fff',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>

          {/* Out of Stock Original Item Box (Swap mode only) */}
          {!isAddMode && originalItem && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1.5px solid #fecaca',
              borderRadius: '12px',
              padding: '12px',
              marginBottom: '16px'
            }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#dc2626', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                ⚠️ Item Out of Stock (खत्म हो गया)
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>
                  {origQty}x {originalItem.name}
                </div>
                <div style={{ fontWeight: 900, color: '#dc2626', fontSize: '0.95rem' }}>
                  ₹{origTotal}
                </div>
              </div>
            </div>
          )}

          {/* Mode Switch: Search Inventory vs Custom */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            <button
              onClick={() => { setUseCustom(false); setSelectedProduct(null); }}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: '10px',
                border: !useCustom ? `2px solid ${isAddMode ? '#059669' : '#0f172a'}` : '1px solid #cbd5e1',
                backgroundColor: !useCustom ? (isAddMode ? '#ecfdf5' : '#f1f5f9') : '#ffffff',
                color: !useCustom ? (isAddMode ? '#065f46' : '#0f172a') : '#64748b',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              📦 Search Store / Catalog
            </button>
            <button
              onClick={() => { setUseCustom(true); setSelectedProduct(null); }}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: '10px',
                border: useCustom ? `2px solid ${isAddMode ? '#059669' : '#0f172a'}` : '1px solid #cbd5e1',
                backgroundColor: useCustom ? (isAddMode ? '#ecfdf5' : '#f1f5f9') : '#ffffff',
                color: useCustom ? (isAddMode ? '#065f46' : '#0f172a') : '#64748b',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              ✍️ Custom Item / Manual
            </button>
          </div>

          {!useCustom ? (
            <div>
              {/* Search Bar */}
              <div style={{ position: 'relative', marginBottom: '10px' }}>
                <input
                  type="text"
                  placeholder={isAddMode ? "Search item to add (e.g. Milk, Bread, Curd)..." : "Search replacement item (e.g. Amul milk, Fortune oil)..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      border: 'none',
                      background: 'transparent',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Product Selection List */}
              <div style={{
                maxHeight: '210px',
                overflowY: 'auto',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '6px',
                backgroundColor: '#fafafa'
              }}>
                {loadingCatalog && filteredProducts.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                    Loading product catalog...
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '0.84rem' }}>
                    No matching products found.
                    <div style={{ marginTop: '6px' }}>
                      <button
                        onClick={() => {
                          setUseCustom(true);
                          setCustomName(searchQuery);
                        }}
                        style={{
                          background: '#059669',
                          color: '#fff',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontWeight: 800,
                          fontSize: '0.78rem',
                          cursor: 'pointer'
                        }}
                      >
                        Add "{searchQuery || 'item'}" via Manual Tab
                      </button>
                    </div>
                  </div>
                ) : (
                  filteredProducts.map((p, idx) => {
                    const isSelected = selectedProduct?._id === p._id;
                    const price = p.sellingPrice || p.price || p.mrp || 0;
                    return (
                      <div
                        key={p._id || idx}
                        onClick={() => {
                          setSelectedProduct(p);
                          if (isAddMode && (!customQty || customQty < 1)) setCustomQty(1);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '9px 11px',
                          borderRadius: '10px',
                          backgroundColor: isSelected ? '#ecfdf5' : '#ffffff',
                          border: isSelected ? '1.5px solid #10b981' : '1px solid #f1f5f9',
                          cursor: 'pointer',
                          marginBottom: '5px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                          transition: '0.15s'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                          {p.image ? (
                            <img src={cdnImage(p.image, 80)} alt="" style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '8px', backgroundColor: '#f8fafc' }} />
                          ) : (
                            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                              {p.emoji || '📦'}
                            </div>
                          )}
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 800, fontSize: '0.86rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {p.name}
                            </div>
                            <div style={{ fontSize: '0.73rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{p.brand ? `${p.brand} · ` : ''}{p.qnty || '1 unit'}</span>
                              {p.isStoreStock && (
                                <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '1px 5px', borderRadius: '4px', fontSize: '0.64rem', fontWeight: 800 }}>
                                  In Store
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '0.92rem' }}>
                            ₹{price}
                          </div>
                          {isSelected && (
                            <div style={{ fontSize: '0.68rem', color: '#059669', fontWeight: 900 }}>
                              ✓ Selected
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Quantity Stepper for Selected Catalog Product */}
              {selectedProduct && (
                <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#334155' }}>
                    Quantity to {isAddMode ? 'Add' : 'Provide'}:
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setCustomQty(prev => Math.max(1, (Number(prev) || 1) - 1))}
                      style={{ width: '30px', height: '30px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontWeight: 900, fontSize: '1rem', cursor: 'pointer' }}
                    >-</button>
                    <input
                      type="number"
                      min="1"
                      value={customQty}
                      onChange={(e) => setCustomQty(Math.max(1, Number(e.target.value) || 1))}
                      style={{ width: '48px', textAlign: 'center', padding: '5px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 800 }}
                    />
                    <button
                      type="button"
                      onClick={() => setCustomQty(prev => (Number(prev) || 1) + 1)}
                      style={{ width: '30px', height: '30px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontWeight: 900, fontSize: '1rem', cursor: 'pointer' }}
                    >+</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  {isAddMode ? 'Item Name & Size (सामान का नाम)' : 'Substitute Item Name & Size (विकल्प का नाम)'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Amul Gold Milk 1 Litre, Britannia Bread..."
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Unit Price (₹) (कीमत)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 68"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ width: '100px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Quantity (मात्रा)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={customQty}
                    onChange={(e) => setCustomQty(Math.max(1, Number(e.target.value) || 1))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Price Difference / Addition Preview */}
          {effectiveItem && (
            <div style={{
              marginTop: '14px',
              backgroundColor: isAddMode ? '#f0fdf4' : (priceDelta > 0 ? '#fffbeb' : '#f0fdf4'),
              border: `1.5px solid ${isAddMode ? '#86efac' : (priceDelta > 0 ? '#fde68a' : '#86efac')}`,
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '0.74rem', color: isAddMode ? '#166534' : (priceDelta > 0 ? '#92400e' : '#166534'), fontWeight: 800 }}>
                  {isAddMode ? 'Total Amount Added to Bill:' : 'Customer Will Be Asked To Pay:'}
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0f172a', marginTop: '2px' }}>
                  {effectiveItem.qty}x {effectiveItem.name} (₹{itemTotal})
                </div>
              </div>
              <div style={{
                textAlign: 'right',
                padding: '5px 12px',
                borderRadius: '8px',
                backgroundColor: isAddMode ? '#dcfce7' : (priceDelta > 0 ? '#ffedd5' : priceDelta < 0 ? '#dcfce7' : '#f1f5f9'),
                color: isAddMode ? '#15803d' : (priceDelta > 0 ? '#c2410c' : priceDelta < 0 ? '#15803d' : '#475569'),
                fontWeight: 900,
                fontSize: '0.92rem'
              }}>
                {isAddMode ? `+₹${itemTotal}` : (priceDelta > 0 ? `+₹${priceDelta}` : priceDelta < 0 ? `-₹${Math.abs(priceDelta)}` : 'Same Price')}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc',
          display: 'flex',
          gap: '10px'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '12px 16px',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              fontWeight: 800,
              color: '#64748b',
              cursor: 'pointer',
              fontSize: '0.88rem'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!effectiveItem || !effectiveItem.name || submitting}
            style={{
              flex: 1,
              padding: '12px 16px',
              backgroundColor: effectiveItem?.name ? (isAddMode ? '#10b981' : '#16a34a') : '#94a3b8',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 900,
              fontSize: '0.92rem',
              cursor: effectiveItem?.name && !submitting ? 'pointer' : 'default',
              boxShadow: effectiveItem?.name ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none'
            }}
          >
            {submitting
              ? (isAddMode ? 'Sending Proposal...' : 'Sending Proposal...')
              : (isAddMode ? `➕ Propose to Customer (+₹${itemTotal})` : '🚀 Propose to Customer (ग्राहक को भेजें)')}
          </button>
        </div>

      </div>
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { shopFetch } from '../../utils/api.js';
import { cdnImage } from '../../utils/cloudinaryUrl.js';

export default function SubstitutePickerModal({
  open,
  order,
  itemIndex,
  shopData,
  onClose,
  onProposalSent,
}) {
  if (!open || !order || itemIndex === undefined) return null;

  const originalItem = order.items?.[itemIndex] || {};
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customQty, setCustomQty] = useState(originalItem.qty || 1);
  const [submitting, setSubmitting] = useState(false);
  const [useCustom, setUseCustom] = useState(false);

  // Shop inventory list
  const catalogProducts = useMemo(() => {
    return Array.isArray(shopData?.products) ? shopData.products : [];
  }, [shopData]);

  // Filter products by search query or item name similarity
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      return catalogProducts.filter(p =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q))
      ).slice(0, 15);
    }
    // Default: suggest products with partial word match from original item
    const words = (originalItem.name || '').toLowerCase().split(/\s+/).filter(w => w.length > 2);
    if (words.length > 0) {
      return catalogProducts.filter(p => {
        const pName = (p.name || '').toLowerCase();
        return words.some(w => pName.includes(w));
      }).slice(0, 15);
    }
    return catalogProducts.slice(0, 15);
  }, [catalogProducts, searchQuery, originalItem.name]);

  const origQty = Number(originalItem.qty) || 1;
  const origPrice = Number(originalItem.sellingPrice || originalItem.price || originalItem.mrp || 0);
  const origTotal = origPrice * origQty;

  const effectiveReplacement = useMemo(() => {
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
      const p = Number(selectedProduct.sellingPrice || selectedProduct.price || selectedProduct.mrp || 0);
      return {
        productId: selectedProduct._id || selectedProduct.productId,
        name: selectedProduct.name,
        brand: selectedProduct.brand || '',
        price: p,
        qty: origQty,
        image: selectedProduct.image || '',
      };
    }
    return null;
  }, [useCustom, customName, customPrice, customQty, selectedProduct, origQty]);

  const replTotal = effectiveReplacement ? effectiveReplacement.price * effectiveReplacement.qty : 0;
  const priceDelta = replTotal - origTotal;

  const handleSendProposal = async () => {
    if (!effectiveReplacement || !effectiveReplacement.name || submitting) return;

    setSubmitting(true);
    try {
      const res = await shopFetch(shopData, `/orders/${order._id}/propose-replacement`, {
        method: 'POST',
        body: JSON.stringify({
          originalItemIndex: itemIndex,
          replacementItem: effectiveReplacement,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Failed to send proposal');
        return;
      }

      const data = await res.json();
      if (onProposalSent) {
        onProposalSent(data.message);
      }
      onClose();
    } catch (err) {
      console.error('Send replacement error:', err);
      alert('Network error while proposing substitute.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.7)',
      backdropFilter: 'blur(4px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        width: '100%',
        maxWidth: '480px',
        maxHeight: '90vh',
        borderRadius: '20px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'scaleIn 0.2s ease-out'
      }}>
        <style>{`
          @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        `}</style>

        {/* Modal Header */}
        <div style={{
          backgroundColor: '#0f172a',
          color: '#ffffff',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900 }}>
              🔄 Propose Substitute (विकल्प चुनें)
            </h3>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
              Order #{(order._id || '').slice(-5).toUpperCase()}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'rgba(255,255,255,0.15)',
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

          {/* Out of Stock Original Item Box */}
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

          {/* Mode Switch: Search Inventory vs Custom */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            <button
              onClick={() => { setUseCustom(false); setSelectedProduct(null); }}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '10px',
                border: !useCustom ? '2px solid #0f172a' : '1px solid #cbd5e1',
                backgroundColor: !useCustom ? '#0f172a' : '#f8fafc',
                color: !useCustom ? '#ffffff' : '#475569',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              📦 From My Store Catalog
            </button>
            <button
              onClick={() => { setUseCustom(true); setSelectedProduct(null); }}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '10px',
                border: useCustom ? '2px solid #0f172a' : '1px solid #cbd5e1',
                backgroundColor: useCustom ? '#0f172a' : '#f8fafc',
                color: useCustom ? '#ffffff' : '#475569',
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
              <input
                type="text"
                placeholder="Search substitute product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.88rem',
                  outline: 'none',
                  marginBottom: '10px',
                  boxSizing: 'border-box'
                }}
              />

              {/* Product Selection List */}
              <div style={{
                maxHeight: '180px',
                overflowY: 'auto',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '4px'
              }}>
                {filteredProducts.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '0.82rem' }}>
                    No products found. Try "Custom Item / Manual" tab.
                  </div>
                ) : (
                  filteredProducts.map((p, idx) => {
                    const isSelected = selectedProduct?._id === p._id;
                    const price = p.sellingPrice || p.price || p.mrp || 0;
                    return (
                      <div
                        key={p._id || idx}
                        onClick={() => setSelectedProduct(p)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                          border: isSelected ? '1.5px solid #3b82f6' : '1px solid transparent',
                          cursor: 'pointer',
                          marginBottom: '4px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                          {p.image ? (
                            <img src={cdnImage(p.image, 80)} alt="" style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '6px' }} />
                          ) : (
                            <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📦</div>
                          )}
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {p.name}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                              {p.brand ? `${p.brand} · ` : ''}{p.qnty || '1 unit'}
                            </div>
                          </div>
                        </div>
                        <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '0.9rem', flexShrink: 0 }}>
                          ₹{price}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Substitute Item Name & Size
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dhara Mustard Oil 1 Litre"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Unit Price (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 145"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ width: '90px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Qty
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={customQty}
                    onChange={(e) => setCustomQty(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Price Difference Preview */}
          {effectiveReplacement && (
            <div style={{
              marginTop: '14px',
              backgroundColor: '#f0fdf4',
              border: '1.5px solid #86efac',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '0.74rem', color: '#166534', fontWeight: 800 }}>
                  Customer Will Be Asked To Pay:
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0f172a', marginTop: '2px' }}>
                  {effectiveReplacement.name} (₹{replTotal})
                </div>
              </div>
              <div style={{
                textAlign: 'right',
                padding: '4px 10px',
                borderRadius: '8px',
                backgroundColor: priceDelta > 0 ? '#ffedd5' : priceDelta < 0 ? '#dcfce7' : '#f1f5f9',
                color: priceDelta > 0 ? '#c2410c' : priceDelta < 0 ? '#15803d' : '#475569',
                fontWeight: 900,
                fontSize: '0.88rem'
              }}>
                {priceDelta > 0 ? `+₹${priceDelta}` : priceDelta < 0 ? `-₹${Math.abs(priceDelta)}` : 'Same Price'}
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
            onClick={handleSendProposal}
            disabled={!effectiveReplacement || !effectiveReplacement.name || submitting}
            style={{
              flex: 1,
              padding: '12px 16px',
              backgroundColor: effectiveReplacement?.name ? '#16a34a' : '#94a3b8',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 900,
              fontSize: '0.92rem',
              cursor: effectiveReplacement?.name && !submitting ? 'pointer' : 'default',
              boxShadow: effectiveReplacement?.name ? '0 4px 12px rgba(22, 163, 74, 0.3)' : 'none'
            }}
          >
            {submitting ? 'Sending Proposal...' : '🚀 Propose to Customer (ग्राहक को भेजें)'}
          </button>
        </div>

      </div>
    </div>
  );
}

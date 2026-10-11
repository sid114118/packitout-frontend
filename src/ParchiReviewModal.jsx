import React, { useEffect, useMemo, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import Fuse from 'fuse.js';
import { useToast } from './ui/DialogProvider.jsx';
import { cdnImage } from './utils/cloudinaryUrl.js';

export default function ParchiReviewModal({
  isOpen,
  items = [],
  onClose,
  onConfirm,
  onSendToShop,
  sendingToShop = false,
  parchiImageUrl = null,
  shopItems = [],
  dailyLimitReached = false,
}) {
  const toast = useToast();

  // Local working copy of rows
  const [rows, setRows] = useState([]);
  const [showSlipViewer, setShowSlipViewer] = useState(false);
  const [searchTargetIdx, setSearchTargetIdx] = useState(null);
  const [drawerQuery, setDrawerQuery] = useState('');

  useEffect(() => {
    if (isOpen && Array.isArray(items)) {
      setRows(items.map((it, idx) => ({
        idx,
        rawText: it.rawText || '',
        cleanItem: it.cleanItem || '',
        brand: it.brand || '',
        packSize: it.packSize || '',
        matched: Boolean(it.matched && it.product),
        confidence: it.confidence || (it.product ? 'high' : 'low'),
        product: it.product || null,
        alternatives: Array.isArray(it.alternatives) ? it.alternatives : [],
        suggestedSearch: it.suggestedSearch || it.cleanItem || it.rawText || '',
        selected: Boolean(it.matched && it.product),
        isCustomNote: !it.product && Boolean(it.rawText),
        qty: Number.isFinite(it.qty) && it.qty > 0 ? it.qty : 1,
      })));
    }
  }, [isOpen, items]);

  // Fuse search instance for the "Pick from Shop" drawer
  const fuse = useMemo(() => {
    if (!shopItems || shopItems.length === 0) return null;
    return new Fuse(shopItems, {
      keys: ['name', 'brand', 'category', 'qnty'],
      threshold: 0.38,
      ignoreLocation: true,
    });
  }, [shopItems]);

  const searchResults = useMemo(() => {
    const q = drawerQuery.trim();
    if (!q) return shopItems.slice(0, 20);
    if (fuse) {
      return fuse.search(q).map(res => res.item).slice(0, 20);
    }
    const lower = q.toLowerCase();
    return shopItems.filter(p =>
      (p.name || '').toLowerCase().includes(lower) ||
      (p.brand || '').toLowerCase().includes(lower) ||
      (p.category || '').toLowerCase().includes(lower)
    ).slice(0, 20);
  }, [drawerQuery, shopItems, fuse]);

  // Bill calculations
  const total = useMemo(() => rows.reduce((sum, r) => {
    if (!r.selected || !r.product) return sum;
    const price = Number(r.product.sellingPrice || r.product.mrp || 0);
    return sum + (price * (r.qty || 1));
  }, 0), [rows]);

  const selectedCount = rows.filter(r => r.selected && (r.product || r.isCustomNote)).length;
  const verifiedCount = rows.filter(r => r.selected && r.product).length;
  const customNotesCount = rows.filter(r => r.selected && r.isCustomNote).length;

  if (!isOpen) return null;

  const updateRow = (idx, patch) => {
    setRows(prev => prev.map(r => r.idx === idx ? { ...r, ...patch } : r));
  };

  const openSearchDrawer = (idx) => {
    const row = rows[idx];
    setSearchTargetIdx(idx);
    setDrawerQuery(row?.suggestedSearch || row?.cleanItem || row?.rawText || '');
  };

  const handleSelectFromDrawer = (selectedProduct) => {
    if (searchTargetIdx === null) return;
    updateRow(searchTargetIdx, {
      product: selectedProduct,
      matched: true,
      confidence: 'high',
      selected: true,
      isCustomNote: false,
    });
    toast(`Assigned ${selectedProduct.name} ✅`);
    setSearchTargetIdx(null);
    setDrawerQuery('');
  };

  const handleConfirm = () => {
    const chosen = rows
      .filter(r => r.selected && (r.product || r.isCustomNote))
      .map(r => ({
        product: r.product,
        qty: r.qty,
        isCustomNote: r.isCustomNote,
        noteText: r.rawText,
      }));

    if (chosen.length === 0) {
      toast("Select at least one item to proceed.", 'warn');
      return;
    }
    onConfirm(chosen);
  };

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(5px)',
        zIndex: 2147483646, display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#f8fafc', width: '100%', maxWidth: 540, maxHeight: '94vh',
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          display: 'flex', flexDirection: 'column',
          animation: 'parchi_sheet_in 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          overflow: 'hidden',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.3)',
          position: 'relative'
        }}
      >
        <style>{`
          @keyframes parchi_sheet_in { from { transform: translateY(100%); } to { transform: translateY(0); } }
          @keyframes parchi_fade { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
          .parchi-press:active { transform: scale(0.97); }
          .parchi-press { transition: transform 0.12s ease; }
          .parchi-scroll::-webkit-scrollbar { display: none; }
          .parchi-scroll { scrollbar-width: none; }
        `}</style>

        {/* 🔝 HEADER */}
        <div style={{ padding: '16px 20px', backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.2rem', fontWeight: 900, letterSpacing: '-0.3px' }}>
                📝 Review Parchi Items
              </h3>
              <span style={{ background: '#ecfdf5', color: '#15803d', border: '1px solid #bbf7d0', fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: '999px' }}>
                {verifiedCount}/{rows.length} matched
              </span>
            </div>
            <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '3px', fontWeight: 500 }}>
              Tap options below to adjust quantities or switch items.
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {parchiImageUrl && (
              <button
                onClick={() => setShowSlipViewer(!showSlipViewer)}
                className="parchi-press"
                style={{
                  background: showSlipViewer ? '#0f172a' : '#f1f5f9',
                  color: showSlipViewer ? '#fff' : '#0f172a',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '6px 12px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <span>🖼️</span> {showSlipViewer ? 'Hide Slip' : 'View Slip'}
              </button>
            )}

            <button
              onClick={onClose}
              aria-label="Close"
              className="parchi-press"
              style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f1f5f9', border: 'none', fontSize: '1.2rem', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >×</button>
          </div>
        </div>

        {/* 🖼️ PICTURE-IN-PICTURE PARCHI VIEWER (Collapsible) */}
        {showSlipViewer && parchiImageUrl && (
          <div style={{ backgroundColor: '#1e293b', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '2px solid #334155', animation: 'parchi_fade 0.2s ease-out' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '10px', overflow: 'hidden', backgroundColor: '#0f172a', border: '1px solid #475569', flexShrink: 0 }}>
              <img src={parchiImageUrl} alt="Parchi Slip Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0, color: '#f8fafc' }}>
              <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>Original Handwritten Slip</div>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '2px' }}>
                Cross-check the handwriting against the auto-matched items below.
              </div>
              <a
                href={parchiImageUrl}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'inline-block', marginTop: '4px', fontSize: '0.75rem', color: '#38bdf8', fontWeight: 700, textDecoration: 'none' }}
              >
                Open Full Photo ↗
              </a>
            </div>
          </div>
        )}

        {/* 💡 DAILY SCAN LIMIT REMINDER (if limit reached) */}
        {dailyLimitReached && (
          <div style={{ background: '#fffbeb', borderBottom: '1px solid #fde68a', padding: '9px 16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#92400e', fontSize: '0.78rem', fontWeight: 600 }}>
            <span>💡</span>
            <span>You've scanned 3 Parchis today! For faster checkout, you can also send photo directly to the shopkeeper.</span>
          </div>
        )}

        {/* 📋 ITEMS LIST SCROLLABLE AREA */}
        <div className="parchi-scroll" style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {rows.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🤔</div>
              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem' }}>No items recognized</div>
              <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>Please ensure the handwriting is visible and well-lit.</div>
            </div>
          ) : (
            rows.map((row) => {
              const isMatched = Boolean(row.product);
              const isHigh = row.confidence === 'high';
              const isMedium = row.confidence === 'medium';
              const hasAlternatives = Array.isArray(row.alternatives) && row.alternatives.length > 0;

              return (
                <div
                  key={row.idx}
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: '16px',
                    padding: '14px',
                    border: isMatched ? (isHigh ? '1.5px solid #bbf7d0' : '1.5px solid #fed7aa') : (row.isCustomNote ? '1.5px dashed #93c5fd' : '1.5px solid #fecaca'),
                    boxShadow: '0 2px 10px rgba(15,23,42,0.04)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Top Bar of Card: Checkbox + Match Badge + Raw Text */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1, minWidth: 0 }}>
                      <input
                        type="checkbox"
                        checked={row.selected}
                        onChange={(e) => updateRow(row.idx, { selected: e.target.checked })}
                        style={{ width: 20, height: 20, accentColor: '#16a34a', cursor: 'pointer', marginTop: '2px', flexShrink: 0 }}
                      />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Status Badge */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          {isMatched ? (
                            isHigh ? (
                              <span style={{ background: '#ecfdf5', color: '#15803d', fontSize: '0.68rem', fontWeight: 800, padding: '2px 7px', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                                🟢 AUTO-MATCHED
                              </span>
                            ) : (
                              <span style={{ background: '#fffbeb', color: '#b45309', fontSize: '0.68rem', fontWeight: 800, padding: '2px 7px', borderRadius: '6px', border: '1px solid #fde68a' }}>
                                🟡 MULTIPLE OPTIONS
                              </span>
                            )
                          ) : row.isCustomNote ? (
                            <span style={{ background: '#eff6ff', color: '#1d4ed8', fontSize: '0.68rem', fontWeight: 800, padding: '2px 7px', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                              📝 NOTE FOR SHOPKEEPER
                            </span>
                          ) : (
                            <span style={{ background: '#fef2f2', color: '#b91c1c', fontSize: '0.68rem', fontWeight: 800, padding: '2px 7px', borderRadius: '6px', border: '1px solid #fecaca' }}>
                              🔴 NOT IN CATALOG
                            </span>
                          )}

                          <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>
                            Slip: <strong style={{ color: '#475569' }}>"{row.rawText}"</strong>
                          </span>
                        </div>

                        {/* Product Title / Unmatched Text */}
                        {isMatched ? (
                          <div>
                            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.98rem', lineHeight: 1.3 }}>
                              {row.product.name}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '3px', fontWeight: 600 }}>
                              {row.product.qnty ? `${row.product.qnty} · ` : ''}
                              <strong style={{ color: '#0f172a' }}>₹{Number(row.product.sellingPrice || row.product.mrp || 0)}</strong>
                              {row.product.mrp && row.product.mrp > row.product.sellingPrice && (
                                <span style={{ textDecoration: 'line-through', color: '#94a3b8', marginLeft: '6px', fontSize: '0.74rem' }}>
                                  ₹{row.product.mrp}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div style={{ fontWeight: 800, color: '#991b1b', fontSize: '0.92rem' }}>
                              {row.cleanItem || row.rawText}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                              {row.isCustomNote
                                ? "Shopkeeper will arrange this item manually upon order."
                                : "No exact catalog match. Pick an alternative from shop or leave as note."}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Product Thumbnail */}
                    {isMatched && (
                      <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                        {row.product.image ? (
                          <img src={cdnImage(row.product.image, 150)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: '1.3rem' }}>{row.product.emoji || '🛒'}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 🟡 1-TAP ALTERNATIVE VARIANT PILLS (For items with alternatives) */}
                  {hasAlternatives && (
                    <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #e2e8f0' }}>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                        Alternative Options in Shop:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {/* Active option pill */}
                        {row.product && (
                          <button
                            type="button"
                            style={{
                              padding: '5px 10px',
                              borderRadius: '8px',
                              border: '1.5px solid #16a34a',
                              background: '#f0fdf4',
                              color: '#166534',
                              fontSize: '0.74rem',
                              fontWeight: 800,
                              cursor: 'default',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <span>✓</span> {row.product.brand ? `${row.product.brand} ` : ''}{row.product.qnty || row.product.name} (₹{row.product.sellingPrice})
                          </button>
                        )}

                        {/* Alternative pills */}
                        {row.alternatives.map((alt) => {
                          if (row.product && String(alt._id) === String(row.product._id)) return null;
                          return (
                            <button
                              key={alt._id}
                              type="button"
                              onClick={() => {
                                updateRow(row.idx, {
                                  product: alt,
                                  matched: true,
                                  confidence: 'high',
                                  selected: true,
                                  isCustomNote: false,
                                });
                                toast(`Switched to ${alt.name}`);
                              }}
                              className="parchi-press"
                              style={{
                                padding: '5px 10px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                background: '#fff',
                                color: '#334155',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                              }}
                            >
                              <span style={{ color: '#3b82f6' }}>↻</span> {alt.brand ? `${alt.brand} ` : ''}{alt.qnty || alt.name} (₹{alt.sellingPrice})
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ⚙️ CONTROLS BAR: QTY ADJUSTER + "PICK FROM SHOP" + "NOTE" TOGGLE */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => openSearchDrawer(row.idx)}
                        className="parchi-press"
                        style={{
                          background: isMatched ? '#f8fafc' : '#0f172a',
                          color: isMatched ? '#334155' : '#fff',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          padding: '6px 10px',
                          fontSize: '0.74rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <span>🔍</span> {isMatched ? 'Swap Item' : 'Pick from Shop'}
                      </button>

                      {!isMatched && (
                        <button
                          onClick={() => updateRow(row.idx, { isCustomNote: !row.isCustomNote, selected: !row.isCustomNote })}
                          className="parchi-press"
                          style={{
                            background: row.isCustomNote ? '#eff6ff' : '#f8fafc',
                            color: row.isCustomNote ? '#1d4ed8' : '#64748b',
                            border: row.isCustomNote ? '1px solid #93c5fd' : '1px solid #e2e8f0',
                            borderRadius: '8px',
                            padding: '6px 10px',
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          {row.isCustomNote ? '✓ Note Attached' : '📝 Keep as Note'}
                        </button>
                      )}
                    </div>

                    {/* Quantity Selector */}
                    {row.selected && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '3px 6px' }}>
                        <button
                          onClick={() => updateRow(row.idx, { qty: Math.max(1, row.qty - 1) })}
                          aria-label="Decrease quantity"
                          style={{ width: '24px', height: '24px', borderRadius: '6px', border: 'none', background: '#fff', color: '#0f172a', fontWeight: 900, cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
                        >-</button>
                        <span style={{ minWidth: '20px', textAlign: 'center', fontWeight: 800, fontSize: '0.85rem', color: '#0f172a' }}>
                          {row.qty}
                        </span>
                        <button
                          onClick={() => updateRow(row.idx, { qty: Math.min(99, row.qty + 1) })}
                          aria-label="Increase quantity"
                          style={{ width: '24px', height: '24px', borderRadius: '6px', border: 'none', background: '#fff', color: '#0f172a', fontWeight: 900, cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
                        >+</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 💵 FOOTER SUMMARY BAR */}
        <div style={{ padding: '14px 20px', backgroundColor: '#fff', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 -4px 15px rgba(0,0,0,0.03)' }}>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#64748b', fontSize: '0.74rem', fontWeight: 700 }}>
              {selectedCount} item{selectedCount === 1 ? '' : 's'} selected
              {customNotesCount > 0 && <span style={{ color: '#2563eb', marginLeft: '4px' }}>({customNotesCount} note)</span>}
            </div>
            <div style={{ color: '#0f172a', fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.3px' }}>
              ₹{total.toFixed(0)}
            </div>
          </div>

          <button
            onClick={handleConfirm}
            disabled={selectedCount === 0}
            className="parchi-press"
            style={{
              background: selectedCount === 0 ? '#cbd5e1' : 'linear-gradient(135deg, #16a34a, #15803d)',
              color: 'white',
              border: 'none',
              borderRadius: '14px',
              padding: '14px 24px',
              fontSize: '0.98rem',
              fontWeight: 800,
              cursor: selectedCount === 0 ? 'not-allowed' : 'pointer',
              boxShadow: selectedCount === 0 ? 'none' : '0 6px 18px rgba(22,163,74,0.32)',
              letterSpacing: '0.2px'
            }}
          >
            Add {selectedCount} to Cart →
          </button>
        </div>

        {/* Option to send photo directly to shopkeeper */}
        {onSendToShop && (
          <div style={{ padding: '0 16px 12px 16px', textAlign: 'center', backgroundColor: '#fff' }}>
            <button
              onClick={onSendToShop}
              disabled={sendingToShop}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: sendingToShop ? 'wait' : 'pointer',
                textDecoration: 'underline',
                padding: '4px'
              }}
            >
              {sendingToShop ? 'Sending image to shop…' : 'Or — let the shopkeeper read it manually'}
            </button>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* 🔍 IN-MODAL SEARCH DRAWER: "Pick from Shop"                        */}
        {/* ------------------------------------------------------------------ */}
        {searchTargetIdx !== null && (
          <div
            onClick={() => setSearchTargetIdx(null)}
            style={{
              position: 'absolute', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)',
              backdropFilter: 'blur(3px)', zIndex: 10, display: 'flex', flexDirection: 'column',
              justifyContent: 'flex-end', animation: 'parchi_fade 0.2s ease-out'
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: '#fff', borderTopLeftRadius: '20px', borderTopRightRadius: '20px',
                height: '80%', display: 'flex', flexDirection: 'column', overflow: 'hidden'
              }}
            >
              {/* Drawer Search Header */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.2rem' }}>🔍</span>
                <input
                  type="text"
                  placeholder="Search item in this shop catalog…"
                  value={drawerQuery}
                  onChange={(e) => setDrawerQuery(e.target.value)}
                  autoFocus
                  style={{
                    flex: 1, padding: '10px 14px', borderRadius: '10px',
                    border: '1.5px solid #cbd5e1', fontSize: '0.95rem',
                    outline: 'none', fontWeight: 600
                  }}
                />
                <button
                  onClick={() => setSearchTargetIdx(null)}
                  style={{ border: 'none', background: '#f1f5f9', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontWeight: 800 }}
                >✕</button>
              </div>

              {/* Drawer Product List */}
              <div className="parchi-scroll" style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {searchResults.length === 0 ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                    No products matching "{drawerQuery}" in this shop.
                  </div>
                ) : (
                  searchResults.map((product) => (
                    <div
                      key={product._id}
                      onClick={() => handleSelectFromDrawer(product)}
                      className="parchi-press"
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 12px', borderRadius: '12px', border: '1px solid #e2e8f0',
                        cursor: 'pointer', backgroundColor: '#f8fafc'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', backgroundColor: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {product.image ? (
                            <img src={cdnImage(product.image, 100)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ fontSize: '1.2rem' }}>{product.emoji || '🛒'}</span>
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {product.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {product.qnty ? `${product.qnty} · ` : ''}₹{product.sellingPrice || product.mrp || 0}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        style={{
                          background: '#16a34a', color: '#fff', border: 'none',
                          borderRadius: '8px', padding: '6px 12px', fontSize: '0.78rem',
                          fontWeight: 800, cursor: 'pointer'
                        }}
                      >
                        Select ✓
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
}

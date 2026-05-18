import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useToast } from './ui/DialogProvider.jsx';
import { cdnImage } from './utils/cloudinaryUrl.js';

export default function ParchiReviewModal({ isOpen, items, onClose, onConfirm, onSendToShop, sendingToShop }) {
  const toast = useToast();

  // Local working copy: per-row { selected, qty }
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (isOpen && Array.isArray(items)) {
      setRows(items.map((it, idx) => ({
        idx,
        rawText: it.rawText,
        matched: it.matched,
        product: it.product,
        note: it.note,
        selected: it.matched, // matched items default checked, unmatched default off
        qty: it.qty || 1,
      })));
    }
  }, [isOpen, items]);

  const total = useMemo(() => rows.reduce((sum, r) => {
    if (!r.selected || !r.product) return sum;
    return sum + (Number(r.product.sellingPrice || r.product.mrp || 0) * (r.qty || 1));
  }, 0), [rows]);

  const selectedCount = rows.filter(r => r.selected && r.product).length;

  if (!isOpen) return null;

  const updateRow = (idx, patch) => {
    setRows(prev => prev.map(r => r.idx === idx ? { ...r, ...patch } : r));
  };

  const handleConfirm = () => {
    const chosen = rows.filter(r => r.selected && r.product).map(r => ({
      product: r.product,
      qty: r.qty,
    }));
    if (chosen.length === 0) {
      toast("Pick at least one item to add.", 'warn');
      return;
    }
    onConfirm(chosen);
  };

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)',
        zIndex: 2147483646, display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'white', width: '100%', maxWidth: 520, maxHeight: '92vh',
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          display: 'flex', flexDirection: 'column',
          animation: 'pkio_sheet_in 0.28s cubic-bezier(0.32,0.72,0,1)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <style>{`@keyframes pkio_sheet_in { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>

        <div style={{ padding: '18px 20px 8px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.15rem', fontWeight: 800 }}>
              📝 Items from your Parchi
            </h3>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{ border: 'none', background: 'transparent', fontSize: '1.4rem', color: '#64748b', cursor: 'pointer', lineHeight: 1 }}
            >×</button>
          </div>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>
            Review and edit, then add to cart.
          </p>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px 12px 12px' }}>
          {rows.length === 0 && (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>🤔</div>
              We couldn't read any items from that photo. Try a clearer picture.
            </div>
          )}

          {rows.map((row) => (
            <div
              key={row.idx}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px',
                borderRadius: 14,
                marginBottom: 8,
                background: row.matched ? '#f8fafc' : '#fff7ed',
                border: row.matched ? '1px solid #e2e8f0' : '1px solid #fed7aa',
                opacity: row.product ? 1 : 0.85,
              }}
            >
              {row.product ? (
                <input
                  type="checkbox"
                  checked={row.selected}
                  onChange={(e) => updateRow(row.idx, { selected: e.target.checked })}
                  style={{ width: 20, height: 20, accentColor: '#16a34a', cursor: 'pointer', flexShrink: 0 }}
                  aria-label={`Select ${row.product.name}`}
                />
              ) : (
                <div style={{ width: 20, fontSize: '1.1rem', flexShrink: 0, textAlign: 'center' }} aria-hidden="true">⚠️</div>
              )}

              <div style={{ width: 44, height: 44, borderRadius: 10, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, border: '1px solid #e2e8f0' }}>
                {row.product?.image ? (
                  <img src={cdnImage(row.product.image, 150)} alt="" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '1.2rem' }}>{row.product?.emoji || '🛒'}</span>
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                {row.product ? (
                  <>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {row.product.name}
                    </div>
                    <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: 2 }}>
                      {row.product.qnty ? `${row.product.qnty} · ` : ''}₹{Number(row.product.sellingPrice || row.product.mrp || 0).toFixed(0)}
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '0.72rem', marginTop: 2, fontStyle: 'italic' }}>
                      You wrote: {row.rawText}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontWeight: 700, color: '#9a3412', fontSize: '0.92rem' }}>
                      {row.rawText || 'Unrecognized item'}
                    </div>
                    <div style={{ color: '#9a3412', fontSize: '0.78rem', marginTop: 2 }}>
                      Not in this shop's catalog. {row.note ? `(${row.note})` : ''}
                    </div>
                  </>
                )}
              </div>

              {row.product && row.selected && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'white', borderRadius: 10, padding: '4px 6px', border: '1px solid #e2e8f0', flexShrink: 0 }}>
                  <button
                    onClick={() => updateRow(row.idx, { qty: Math.max(1, row.qty - 1) })}
                    aria-label="Decrease quantity"
                    style={qtyBtn}
                  >−</button>
                  <span style={{ minWidth: 18, textAlign: 'center', fontWeight: 700, color: '#0f172a' }}>{row.qty}</span>
                  <button
                    onClick={() => updateRow(row.idx, { qty: Math.min(99, row.qty + 1) })}
                    aria-label="Increase quantity"
                    style={qtyBtn}
                    disabled={row.qty >= 99}
                  >+</button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ padding: '12px 16px 14px 16px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>
              {selectedCount} item{selectedCount === 1 ? '' : 's'} selected
            </div>
            <div style={{ color: '#0f172a', fontSize: '1.2rem', fontWeight: 900 }}>
              ₹{total.toFixed(0)}
            </div>
          </div>
          <button
            onClick={handleConfirm}
            disabled={selectedCount === 0}
            style={{
              background: selectedCount === 0 ? '#cbd5e1' : '#16a34a',
              color: 'white', border: 'none', borderRadius: 14,
              padding: '14px 22px', fontSize: '0.95rem', fontWeight: 800,
              cursor: selectedCount === 0 ? 'not-allowed' : 'pointer',
              boxShadow: selectedCount === 0 ? 'none' : '0 4px 12px rgba(22,163,74,0.35)',
              fontFamily: 'inherit',
            }}
          >
            Add to Cart →
          </button>
        </div>

        {onSendToShop && (
          <div style={{ padding: '0 16px 16px 16px', textAlign: 'center' }}>
            <button
              onClick={onSendToShop}
              disabled={sendingToShop}
              style={{
                background: 'transparent', border: 'none', color: '#64748b',
                fontSize: '0.82rem', fontWeight: 600, cursor: sendingToShop ? 'wait' : 'pointer',
                textDecoration: 'underline', fontFamily: 'inherit', padding: 4
              }}
            >
              {sendingToShop ? 'Sending image to shop…' : 'Or — let the shopkeeper read it manually'}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

const qtyBtn = {
  width: 26, height: 26, borderRadius: 8, border: 'none',
  background: '#f1f5f9', color: '#0f172a', fontWeight: 800, cursor: 'pointer', fontSize: '1rem',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

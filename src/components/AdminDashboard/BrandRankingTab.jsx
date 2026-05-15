import React, { useEffect, useMemo, useState } from 'react';
import { useToast } from '../../ui/DialogProvider.jsx';
import { useRankingConfig } from '../../ui/RankingProvider.jsx';

const BASE_URL = (import.meta.env.VITE_API_BASE || "https://darkslategrey-snail-415133.hostingersite.com");

export default function BrandRankingTab() {
  const toast = useToast();
  const { refresh: refreshGlobalConfig } = useRankingConfig();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allBrands, setAllBrands] = useState([]);   // distinct brand names from master catalog
  const [enabled, setEnabled] = useState(false);    // global on/off
  const [brandOrder, setBrandOrder] = useState([]); // lowercased, ordered
  const [pickerQuery, setPickerQuery] = useState('');
  const [dirty, setDirty] = useState(false);

  // Load brands + current config in parallel
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [brandsRes, configRes] = await Promise.all([
          fetch(`${BASE_URL}/brands`),
          fetch(`${BASE_URL}/ranking-config`),
        ]);
        const brandsData = brandsRes.ok ? await brandsRes.json() : [];
        const configData = configRes.ok ? await configRes.json() : null;
        if (cancelled) return;
        setAllBrands(Array.isArray(brandsData) ? brandsData : []);
        if (configData) {
          setEnabled(!!configData.enabled);
          setBrandOrder(Array.isArray(configData.brandOrder) ? configData.brandOrder.map(s => String(s).toLowerCase()) : []);
        }
      } catch (err) {
        if (!cancelled) toast('Could not load ranking config.', 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line
  }, []);

  // Brand label lookup so the priority list shows the original capitalisation
  // even though we store lowercased keys.
  const brandLabel = useMemo(() => {
    const map = new Map();
    allBrands.forEach(b => { map.set(String(b).toLowerCase(), b); });
    return (lc) => map.get(lc) || lc;
  }, [allBrands]);

  // Brands available to add = all brands minus already-ordered.
  // Filtered by the search input so admin can find a brand in a long list.
  const availableBrands = useMemo(() => {
    const inOrder = new Set(brandOrder);
    const q = pickerQuery.trim().toLowerCase();
    return allBrands.filter(b => {
      const lc = String(b).toLowerCase();
      if (inOrder.has(lc)) return false;
      if (q && !lc.includes(q)) return false;
      return true;
    });
  }, [allBrands, brandOrder, pickerQuery]);

  const setOrderDirty = (next) => {
    setBrandOrder(next);
    setDirty(true);
  };

  const addBrand = (brand) => {
    const lc = String(brand).toLowerCase();
    if (brandOrder.includes(lc)) return;
    setOrderDirty([...brandOrder, lc]);
  };

  const removeBrand = (lc) => setOrderDirty(brandOrder.filter(b => b !== lc));

  const move = (lc, delta) => {
    const idx = brandOrder.indexOf(lc);
    if (idx === -1) return;
    const target = idx + delta;
    if (target < 0 || target >= brandOrder.length) return;
    const next = brandOrder.slice();
    [next[idx], next[target]] = [next[target], next[idx]];
    setOrderDirty(next);
  };

  const toEnabled = (v) => {
    setEnabled(v);
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/ranking-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled, brandOrder }),
      });
      if (!res.ok) throw new Error('Save failed');
      const doc = await res.json();
      setEnabled(!!doc.enabled);
      setBrandOrder(Array.isArray(doc.brandOrder) ? doc.brandOrder : []);
      setDirty(false);
      toast('Ranking saved');
      // Push the new config to every consumer on this tab too.
      refreshGlobalConfig();
    } catch (err) {
      console.error(err);
      toast('Could not save. Try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleResetToServer = async () => {
    try {
      const res = await fetch(`${BASE_URL}/ranking-config`);
      if (!res.ok) throw new Error();
      const doc = await res.json();
      setEnabled(!!doc.enabled);
      setBrandOrder(Array.isArray(doc.brandOrder) ? doc.brandOrder.map(s => String(s).toLowerCase()) : []);
      setDirty(false);
      toast('Reverted to saved');
    } catch {
      toast('Could not refresh.', 'error');
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading ranking config…</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div>
          <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.25rem' }}>🎯 Brand Ranking Control</h3>
          <div style={{ color: '#64748b', fontSize: '0.86rem', marginTop: '4px', fontWeight: 600, maxWidth: '640px' }}>
            Decide which brands surface first across search, categories, and the home feed.
            When the switch is off, the app uses its normal order. When on, products from your
            ranked brands appear first; everything else keeps its normal order behind them.
          </div>
        </div>
      </div>

      {/* Enabled toggle */}
      <div style={{
        background: enabled ? '#ecfdf5' : '#fff7ed',
        border: `1px solid ${enabled ? '#bbf7d0' : '#fed7aa'}`,
        borderRadius: '12px',
        padding: '14px 16px',
        marginBottom: '16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ fontWeight: 800, color: enabled ? '#15803d' : '#9a3412' }}>
            {enabled ? 'Admin ranking is ON' : 'Admin ranking is OFF (normal mode)'}
          </div>
          <div style={{ color: '#475569', fontSize: '0.84rem', fontWeight: 600, marginTop: '2px' }}>
            {enabled
              ? 'Your brand order below is applied everywhere customers see products.'
              : 'Toggle on and add brands to start controlling what appears first.'}
          </div>
        </div>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => toEnabled(e.target.checked)}
            style={{ width: 0, height: 0, opacity: 0, position: 'absolute' }}
          />
          <span style={{
            position: 'relative', display: 'inline-block',
            width: '46px', height: '26px', borderRadius: '999px',
            background: enabled ? '#16a34a' : '#cbd5e1',
            transition: 'background 0.15s',
          }}>
            <span style={{
              position: 'absolute', top: '3px', left: enabled ? '23px' : '3px',
              width: '20px', height: '20px', borderRadius: '50%',
              background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              transition: 'left 0.15s',
            }} />
          </span>
          <span style={{ fontWeight: 800, color: '#0f172a' }}>{enabled ? 'Enabled' : 'Disabled'}</span>
        </label>
      </div>

      {/* Two-column workspace */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) minmax(220px, 1.2fr)', gap: '16px' }}>
        {/* Available brands */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', minHeight: '300px' }}>
          <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
            Available brands ({availableBrands.length})
          </div>
          <input
            type="text"
            value={pickerQuery}
            onChange={(e) => setPickerQuery(e.target.value)}
            placeholder="Search brand…"
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '8px 12px',
              border: '1px solid #cbd5e1', borderRadius: '8px',
              fontSize: '0.9rem', outline: 'none', marginBottom: '10px',
            }}
          />
          <div style={{ maxHeight: '420px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {availableBrands.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>
                {pickerQuery ? 'No matching brands.' : 'All brands already prioritized.'}
              </div>
            ) : (
              availableBrands.map(b => (
                <button
                  key={b}
                  onClick={() => addBrand(b)}
                  style={{
                    appearance: 'none',
                    textAlign: 'left',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '0.9rem', fontWeight: 600, color: '#0f172a',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}
                >
                  <span>{b}</span>
                  <span style={{ color: '#16a34a', fontWeight: 800, fontSize: '0.85rem' }}>+ Add</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Priority list */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', minHeight: '300px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontWeight: 800, color: '#0f172a' }}>
              Your priority order
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>
              {brandOrder.length} {brandOrder.length === 1 ? 'brand' : 'brands'} · top = first
            </div>
          </div>

          {brandOrder.length === 0 ? (
            <div style={{
              border: '1px dashed #cbd5e1', borderRadius: '10px',
              padding: '32px 16px', textAlign: 'center',
              color: '#94a3b8', fontSize: '0.9rem', fontWeight: 600,
            }}>
              Add brands from the left to start ranking.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {brandOrder.map((lc, idx) => (
                <div
                  key={lc}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr auto',
                    alignItems: 'center', gap: '10px',
                    background: idx === 0 ? '#f0fdf4' : '#fff',
                    border: `1px solid ${idx === 0 ? '#bbf7d0' : '#e2e8f0'}`,
                    borderRadius: '10px',
                    padding: '8px 10px',
                  }}
                >
                  <span style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: idx === 0 ? '#16a34a' : '#0f172a',
                    color: '#fff', fontWeight: 900, fontSize: '0.78rem',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {idx + 1}
                  </span>
                  <span style={{ fontWeight: 700, color: '#0f172a', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {brandLabel(lc)}
                  </span>
                  <span style={{ display: 'inline-flex', gap: '4px' }}>
                    <button onClick={() => move(lc, -1)} disabled={idx === 0} title="Move up" style={iconBtn(idx === 0)}>▲</button>
                    <button onClick={() => move(lc, 1)} disabled={idx === brandOrder.length - 1} title="Move down" style={iconBtn(idx === brandOrder.length - 1)}>▼</button>
                    <button onClick={() => removeBrand(lc)} title="Remove" style={{ ...iconBtn(false), color: '#dc2626', borderColor: '#fecaca' }}>✕</button>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Save bar */}
      <div style={{
        marginTop: '18px',
        background: dirty ? '#fff7ed' : '#f8fafc',
        border: `1px solid ${dirty ? '#fed7aa' : '#e2e8f0'}`,
        borderRadius: '12px',
        padding: '12px 16px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
      }}>
        <div style={{ fontSize: '0.86rem', fontWeight: 700, color: dirty ? '#9a3412' : '#475569' }}>
          {dirty ? 'You have unsaved changes' : 'All changes saved'}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleResetToServer}
            disabled={!dirty || saving}
            style={{
              padding: '9px 14px',
              background: '#fff', color: '#0f172a',
              border: '1px solid #cbd5e1', borderRadius: '8px',
              fontWeight: 700, cursor: !dirty || saving ? 'not-allowed' : 'pointer',
              opacity: !dirty || saving ? 0.5 : 1,
            }}
          >
            Revert
          </button>
          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            style={{
              padding: '9px 18px',
              background: '#16a34a', color: '#fff',
              border: 'none', borderRadius: '8px',
              fontWeight: 800, cursor: !dirty || saving ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(22,163,74,0.20)',
              opacity: !dirty || saving ? 0.55 : 1,
            }}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

const iconBtn = (disabled) => ({
  width: '28px', height: '28px',
  border: '1px solid #e2e8f0', borderRadius: '6px',
  background: '#fff', color: '#475569',
  fontSize: '0.78rem', fontWeight: 700,
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.35 : 1,
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
});

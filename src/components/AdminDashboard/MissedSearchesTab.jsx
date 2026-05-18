import React, { useEffect, useMemo, useState } from 'react';
import { useToast, useConfirm } from '../../ui/DialogProvider.jsx';
import { adminFetch, BASE_URL } from '../../utils/api.js';

const SORT_OPTIONS = [
  { key: 'count',          label: 'Most searched' },
  { key: 'lastSearchedAt', label: 'Recent first' },
];

const FILTERS = [
  { key: 'false', label: 'Open' },
  { key: 'true',  label: 'Resolved' },
  { key: 'all',   label: 'All' },
];

const fmtWhen = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  } catch { return iso; }
};

export default function MissedSearchesTab() {
  const toast = useToast();
  const askConfirm = useConfirm();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState('count');
  const [filterKey, setFilterKey] = useState('false');
  const [query, setQuery] = useState('');

  const fetchAll = async (sort = sortKey, resolved = filterKey) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort, resolved });
      const res = await fetch(`${BASE_URL}/missed-searches?${params}`);
      const data = res.ok ? await res.json() : [];
      setRows(Array.isArray(data) ? data : []);
    } catch {
      setRows([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchAll(sortKey, filterKey); /* eslint-disable-line */ }, [sortKey, filterKey]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r => (r.term || '').toLowerCase().includes(q));
  }, [rows, query]);

  const totals = useMemo(() => {
    const open = rows.filter(r => !r.resolved).length;
    const resolved = rows.filter(r => r.resolved).length;
    const searches = rows.reduce((s, r) => s + (r.count || 0), 0);
    return { open, resolved, searches };
  }, [rows]);

  const toggleResolved = async (row) => {
    const next = !row.resolved;
    // Optimistic flip — local list updates immediately; revert if server says no.
    setRows(prev => prev.map(r => r._id === row._id ? { ...r, resolved: next } : r));
    try {
      const res = await adminFetch(`/missed-searches/${row._id}/resolve`, {
        method: 'PATCH',
        body: JSON.stringify({ resolved: next }),
      });
      if (!res.ok) throw new Error('Server rejected update');
      toast(next ? 'Marked as resolved' : 'Reopened');
      // If the current filter would hide the row now, drop it from the list.
      if (filterKey !== 'all' && filterKey !== String(next)) {
        setRows(prev => prev.filter(r => r._id !== row._id));
      }
    } catch (err) {
      console.error(err);
      setRows(prev => prev.map(r => r._id === row._id ? { ...r, resolved: !next } : r));
      toast('Could not update. Try again.', 'error');
    }
  };

  const handleDelete = async (row) => {
    const ok = await askConfirm({
      title: 'Delete missed search?',
      message: `Remove "${row.term}" from the missed-search list?`,
      confirmText: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    // Use functional setRows so a concurrent toggle on another row is preserved
    // when we have to roll back on error.
    let snapshot = null;
    setRows(prev => { snapshot = prev; return prev.filter(r => r._id !== row._id); });
    try {
      const res = await adminFetch(`/missed-searches/${row._id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Server rejected delete');
      toast('Deleted');
    } catch (err) {
      console.error(err);
      if (snapshot) setRows(snapshot);
      toast('Could not delete. Try again.', 'error');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div>
          <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.25rem' }}>🔎 Missed Searches</h3>
          <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px', fontWeight: 600 }}>
            Things customers looked for but couldn't find — candidates for the catalog.
          </div>
        </div>
        <button
          onClick={() => fetchAll()}
          style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
        >
          ↻ Refresh
        </button>
      </div>

      {/* Stat strip */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px',
        marginBottom: '16px',
      }}>
        <StatCard label="Open terms" value={totals.open} accent="#dc2626" />
        <StatCard label="Resolved" value={totals.resolved} accent="#16a34a" />
        <StatCard label="Total searches" value={totals.searches} accent="#1d4ed8" />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
        <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</span>
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilterKey(f.key)} style={pillStyle(filterKey === f.key)}>
            {f.label}
          </button>
        ))}
        <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginLeft: '12px' }}>Sort</span>
        {SORT_OPTIONS.map(s => (
          <button key={s.key} onClick={() => setSortKey(s.key)} style={pillStyle(sortKey === s.key)}>
            {s.label}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', minWidth: '200px' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by term…"
            style={{
              width: '100%', padding: '8px 12px',
              border: '1px solid #cbd5e1', borderRadius: '8px',
              fontSize: '0.9rem', outline: 'none',
            }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{
          background: '#fff', border: '1px dashed #cbd5e1', borderRadius: '12px',
          padding: '40px 20px', textAlign: 'center', color: '#64748b',
        }}>
          <div style={{ fontSize: '2.4rem', marginBottom: '10px' }}>🎉</div>
          <div style={{ fontWeight: 800, color: '#0f172a' }}>
            {filterKey === 'false' ? 'No open missed searches' : 'Nothing here yet'}
          </div>
          <div style={{ fontSize: '0.88rem', marginTop: '6px' }}>
            When a customer searches and finds nothing, it'll show up here.
          </div>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          {filtered.map((r, idx) => (
            <div
              key={r._id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: '12px',
                padding: '14px 16px',
                borderBottom: idx === filtered.length - 1 ? 'none' : '1px solid #f1f5f9',
                alignItems: 'center',
                background: r.resolved ? '#f8fafc' : '#fff',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                  <span style={{
                    fontWeight: 800, color: '#0f172a',
                    fontSize: '1.02rem',
                    textDecoration: r.resolved ? 'line-through' : 'none',
                  }}>
                    {r.term}
                  </span>
                  <span style={{
                    background: '#eff6ff', color: '#1d4ed8',
                    fontSize: '0.72rem', fontWeight: 800,
                    padding: '2px 8px', borderRadius: '999px',
                  }}>
                    {r.count} {r.count === 1 ? 'search' : 'searches'}
                  </span>
                  {r.resolved && (
                    <span style={{
                      background: '#ecfdf5', color: '#15803d',
                      fontSize: '0.72rem', fontWeight: 800,
                      padding: '2px 8px', borderRadius: '999px',
                    }}>
                      Resolved
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                  Last searched {fmtWhen(r.lastSearchedAt)}
                  {Array.isArray(r.pincodes) && r.pincodes.length > 0 && (
                    <> · From {r.pincodes.length} {r.pincodes.length === 1 ? 'pincode' : 'pincodes'}: {r.pincodes.slice(0, 3).join(', ')}{r.pincodes.length > 3 ? '…' : ''}</>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={() => toggleResolved(r)}
                  style={{
                    padding: '8px 14px',
                    background: r.resolved ? '#fff' : '#16a34a',
                    color: r.resolved ? '#15803d' : '#fff',
                    border: r.resolved ? '1px solid #bbf7d0' : 'none',
                    borderRadius: '8px',
                    fontWeight: 800, fontSize: '0.85rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {r.resolved ? 'Reopen' : 'Mark resolved'}
                </button>
                <button
                  onClick={() => handleDelete(r)}
                  title="Delete from list"
                  style={{
                    padding: '8px 10px',
                    background: '#fff',
                    color: '#dc2626',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    fontWeight: 800, fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 14px' }}>
      <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 800, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ marginTop: '4px', fontSize: '1.45rem', fontWeight: 900, color: accent, letterSpacing: '-0.3px' }}>
        {value}
      </div>
    </div>
  );
}

const pillStyle = (active) => ({
  padding: '6px 12px',
  borderRadius: '999px',
  border: active ? '1px solid #0f172a' : '1px solid #e2e8f0',
  background: active ? '#0f172a' : '#fff',
  color: active ? '#fff' : '#0f172a',
  fontSize: '0.82rem',
  fontWeight: 700,
  cursor: 'pointer',
});

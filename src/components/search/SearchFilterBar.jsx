import React, { useState, useRef, useEffect } from 'react';
import { SORT_OPTIONS } from '../../utils/dynamicFilterExtractor.js';

/**
 * SearchFilterBar
 * 
 * Horizontally scrollable context-aware filter and sort bar matching the UI reference image.
 * Features:
 * - [ 🎛 Filters ▾ ] button with active badge count
 * - [ ↑↓ Sort ▾ ] button with active sort state
 * - [ Price ▾ ] price range selector
 * - Dynamic context-aware pills (e.g. [ Gender ▾ ] for powder, [ Price per kg ▾ ] for rice, [ Brand ▾ ])
 * - Seamless dropdown/sheet selectors with count badges
 * 
 * @param {object} props
 * @param {Array} props.filterPills - Dynamic pills config from dynamicFilterExtractor
 * @param {object} props.activeFilters - Active filter selections
 * @param {string} props.activeSort - Active sort ID (e.g. 'relevance', 'price_asc')
 * @param {object} props.priceRange - { min, max }
 * @param {function} props.onFilterChange - Callback (newFilters) => void
 * @param {function} props.onSortChange - Callback (newSortId) => void
 * @param {function} props.onClearFilters - Callback () => void
 */
export default function SearchFilterBar({
  filterPills = [],
  activeFilters = {},
  activeSort = 'relevance',
  priceRange = { min: 0, max: 1000 },
  onFilterChange,
  onSortChange,
  onClearFilters,
}) {
  const [openDropdown, setOpenDropdown] = useState(null); // 'filters' | 'sort' | 'price' | pill.key
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!openDropdown) return;
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('pointerdown', handleOutsideClick);
    return () => document.removeEventListener('pointerdown', handleOutsideClick);
  }, [openDropdown]);

  // Compute total active filters count
  const activeCount = Object.entries(activeFilters).reduce((acc, [key, val]) => {
    if (val === undefined || val === null || val === '') return acc;
    if (Array.isArray(val)) return acc + val.length;
    return acc + 1;
  }, 0);

  const toggleDropdown = (id) => {
    setOpenDropdown(prev => (prev === id ? null : id));
  };

  const handleSelectOption = (key, value, isMulti = false) => {
    if (isMulti) {
      const current = Array.isArray(activeFilters[key]) ? [...activeFilters[key]] : [];
      const idx = current.indexOf(value);
      if (idx > -1) {
        current.splice(idx, 1);
      } else {
        current.push(value);
      }
      onFilterChange({
        ...activeFilters,
        [key]: current.length > 0 ? current : undefined
      });
    } else {
      // Single select toggle
      const isCurrentlySelected = activeFilters[key] === value;
      onFilterChange({
        ...activeFilters,
        [key]: isCurrentlySelected ? undefined : value
      });
      setOpenDropdown(null);
    }
  };

  const currentSortLabel = SORT_OPTIONS.find(s => s.id === activeSort)?.label || 'Sort';

  return (
    <div
      style={{
        position: 'relative',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #f1f5f9',
        padding: '10px 14px',
        zIndex: 1500,
      }}
    >
      <style>{`
        .pio-filter-scroll::-webkit-scrollbar { display: none; }
        .pio-filter-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        .pio-pill-button {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 34px;
          padding: 0 12px;
          border-radius: 9999px;
          font-size: 0.82rem;
          font-weight: 600;
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.15s ease;
          border: 1px solid #e2e8f0;
          background-color: #ffffff;
          color: #1e293b;
          user-select: none;
        }
        .pio-pill-button:active {
          transform: scale(0.97);
        }
        .pio-pill-active {
          background-color: #f0fdf4 !important;
          border-color: #16a34a !important;
          color: #15803d !important;
          font-weight: 700 !important;
        }
        .pio-dropdown-card {
          animation: popoverFade 0.16s ease-out;
        }
        @keyframes popoverFade {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Horizontal scrolling pill row */}
      <div
        className="pio-filter-scroll"
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          alignItems: 'center',
          paddingBottom: '2px',
        }}
      >
        {/* 1. [ 🎛 Filters ▾ ] Pill */}
        <button
          type="button"
          onClick={() => toggleDropdown('filters')}
          className={`pio-pill-button ${activeCount > 0 ? 'pio-pill-active' : ''}`}
          style={{
            fontWeight: activeCount > 0 ? 800 : 600,
            boxShadow: activeCount > 0 ? '0 1px 4px rgba(22, 163, 74, 0.15)' : 'none',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" x2="20" y1="21" y2="21" />
            <line x1="4" x2="20" y1="14" y2="14" />
            <line x1="4" x2="20" y1="7" y2="7" />
            <circle cx="8" cy="7" r="3" />
            <circle cx="16" cy="14" r="3" />
            <circle cx="10" cy="21" r="3" />
          </svg>
          <span>Filters</span>
          {activeCount > 0 && (
            <span
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                backgroundColor: '#16a34a',
                color: '#fff',
                fontSize: '0.68rem',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
              }}
            >
              {activeCount}
            </span>
          )}
          <span style={{ fontSize: '0.75rem', color: activeCount > 0 ? '#16a34a' : '#64748b' }}>▾</span>
        </button>

        {/* 2. [ ↑↓ Sort ▾ ] Pill */}
        <button
          type="button"
          onClick={() => toggleDropdown('sort')}
          className={`pio-pill-button ${activeSort !== 'relevance' ? 'pio-pill-active' : ''}`}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 16 4 4 4-4" />
            <path d="M7 20V4" />
            <path d="m21 8-4-4-4 4" />
            <path d="M17 4v16" />
          </svg>
          <span>{activeSort === 'relevance' ? 'Sort' : currentSortLabel}</span>
          <span style={{ fontSize: '0.75rem', color: activeSort !== 'relevance' ? '#16a34a' : '#64748b' }}>▾</span>
        </button>

        {/* 3. [ Price ▾ ] Pill */}
        <button
          type="button"
          onClick={() => toggleDropdown('price')}
          className={`pio-pill-button ${(activeFilters.minPrice || activeFilters.maxPrice) ? 'pio-pill-active' : ''}`}
        >
          <span>
            {activeFilters.maxPrice
              ? `Under ₹${activeFilters.maxPrice}`
              : activeFilters.minPrice
              ? `Above ₹${activeFilters.minPrice}`
              : 'Price'}
          </span>
          <span style={{ fontSize: '0.75rem', color: (activeFilters.minPrice || activeFilters.maxPrice) ? '#16a34a' : '#64748b' }}>▾</span>
        </button>

        {/* 4. Context-Aware Dynamic Pills (e.g. Gender, Brand, Grain Type, Price per kg) */}
        {filterPills.map(pill => {
          const isActive = activeFilters[pill.key] !== undefined && activeFilters[pill.key] !== '';
          const activeVal = activeFilters[pill.key];
          const displayLabel = Array.isArray(activeVal)
            ? `${pill.label} (${activeVal.length})`
            : activeVal
            ? activeVal
            : pill.label;

          return (
            <button
              key={pill.key}
              type="button"
              onClick={() => toggleDropdown(pill.key)}
              className={`pio-pill-button ${isActive ? 'pio-pill-active' : ''}`}
            >
              <span>{displayLabel}</span>
              <span style={{ fontSize: '0.75rem', color: isActive ? '#16a34a' : '#64748b' }}>▾</span>
            </button>
          );
        })}

        {/* Clear All action when filters applied */}
        {(activeCount > 0 || activeSort !== 'relevance') && (
          <button
            type="button"
            onClick={onClearFilters}
            style={{
              background: 'none',
              border: 'none',
              color: '#ef4444',
              fontSize: '0.8rem',
              fontWeight: 700,
              padding: '0 8px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Clear all
          </button>
        )}
      </div>

      {/* DROPDOWN / POPOVER MENUS */}
      {openDropdown && (
        <div
          ref={dropdownRef}
          className="pio-dropdown-card"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: '14px',
            right: '14px',
            maxWidth: '380px',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 12px 30px -4px rgba(15, 23, 42, 0.18), 0 4px 10px rgba(0,0,0,0.06)',
            border: '1px solid #e2e8f0',
            padding: '14px',
            zIndex: 3000,
          }}
        >
          {/* SORT MENU */}
          {openDropdown === 'sort' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a' }}>Sort By</div>
                <button
                  type="button"
                  onClick={() => setOpenDropdown(null)}
                  style={{ background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: '#64748b' }}
                >✕</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {SORT_OPTIONS.map(opt => {
                  const isSelected = activeSort === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => { onSortChange(opt.id); setOpenDropdown(null); }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        backgroundColor: isSelected ? '#f0fdf4' : 'transparent',
                        color: isSelected ? '#15803d' : '#1e293b',
                        fontWeight: isSelected ? 700 : 500,
                        fontSize: '0.9rem',
                      }}
                    >
                      <span>{opt.label}</span>
                      {isSelected && (
                        <span style={{ color: '#16a34a', fontWeight: 800 }}>✓</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* PRICE RANGE MENU */}
          {openDropdown === 'price' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a' }}>Price Range</div>
                <button
                  type="button"
                  onClick={() => setOpenDropdown(null)}
                  style={{ background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: '#64748b' }}
                >✕</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  { label: 'Under ₹100', max: 100 },
                  { label: '₹100 - ₹200', min: 100, max: 200 },
                  { label: '₹200 - ₹500', min: 200, max: 500 },
                  { label: 'Above ₹500', min: 500 },
                ].map((tier, idx) => {
                  const isSelected = activeFilters.minPrice === tier.min && activeFilters.maxPrice === tier.max;
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        if (isSelected) {
                          onFilterChange({ ...activeFilters, minPrice: undefined, maxPrice: undefined });
                        } else {
                          onFilterChange({ ...activeFilters, minPrice: tier.min, maxPrice: tier.max });
                        }
                        setOpenDropdown(null);
                      }}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        backgroundColor: isSelected ? '#f0fdf4' : 'transparent',
                        color: isSelected ? '#15803d' : '#1e293b',
                        fontWeight: isSelected ? 700 : 500,
                        fontSize: '0.9rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>{tier.label}</span>
                      {isSelected && <span style={{ color: '#16a34a' }}>✓</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* DYNAMIC PILL OPTIONS (e.g. Gender, Brand, Grain Type, Price per kg) */}
          {filterPills.some(p => p.key === openDropdown) && (() => {
            const pill = filterPills.find(p => p.key === openDropdown);
            if (!pill) return null;
            const isMulti = pill.type === 'multi_select';

            return (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a' }}>
                    Select {pill.label}
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpenDropdown(null)}
                    style={{ background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: '#64748b' }}
                  >✕</button>
                </div>
                <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {pill.options.map(opt => {
                    const isSelected = isMulti
                      ? Array.isArray(activeFilters[pill.key]) && activeFilters[pill.key].includes(opt.value)
                      : activeFilters[pill.key] === opt.value;

                    return (
                      <div
                        key={opt.value}
                        onClick={() => handleSelectOption(pill.key, opt.value, isMulti)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 12px',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          backgroundColor: isSelected ? '#f0fdf4' : 'transparent',
                          color: isSelected ? '#15803d' : '#1e293b',
                          fontWeight: isSelected ? 700 : 500,
                          fontSize: '0.9rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {isMulti && (
                            <span
                              style={{
                                width: '16px',
                                height: '16px',
                                borderRadius: '4px',
                                border: isSelected ? '1.5px solid #16a34a' : '1.5px solid #cbd5e1',
                                backgroundColor: isSelected ? '#16a34a' : '#fff',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                fontSize: '0.65rem',
                                fontWeight: 800,
                              }}
                            >
                              {isSelected ? '✓' : ''}
                            </span>
                          )}
                          <span>{opt.label}</span>
                        </div>
                        {opt.count !== undefined && (
                          <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                            {opt.count}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {isMulti && (
                  <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => setOpenDropdown(null)}
                      style={{
                        backgroundColor: '#16a34a',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '6px 14px',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ALL FILTERS DRAWER / SUMMARY */}
          {openDropdown === 'filters' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#0f172a' }}>All Filters</div>
                <button
                  type="button"
                  onClick={() => setOpenDropdown(null)}
                  style={{ background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: '#64748b' }}
                >✕</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '340px', overflowY: 'auto' }}>
                {filterPills.map(pill => (
                  <div key={pill.key}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                      {pill.label}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {pill.options.map(opt => {
                        const isSelected = pill.type === 'multi_select'
                          ? Array.isArray(activeFilters[pill.key]) && activeFilters[pill.key].includes(opt.value)
                          : activeFilters[pill.key] === opt.value;

                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => handleSelectOption(pill.key, opt.value, pill.type === 'multi_select')}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '999px',
                              border: isSelected ? '1px solid #16a34a' : '1px solid #e2e8f0',
                              backgroundColor: isSelected ? '#f0fdf4' : '#f8fafc',
                              color: isSelected ? '#15803d' : '#334155',
                              fontSize: '0.82rem',
                              fontWeight: isSelected ? 700 : 500,
                              cursor: 'pointer',
                            }}
                          >
                            {opt.label} {opt.count !== undefined && `(${opt.count})`}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={onClearFilters}
                  style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Reset All
                </button>
                <button
                  type="button"
                  onClick={() => setOpenDropdown(null)}
                  style={{
                    backgroundColor: '#16a34a',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

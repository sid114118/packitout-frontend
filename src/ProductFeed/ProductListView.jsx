import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ModernProductCard } from './FeedComponents.jsx';
import { cdnImage } from '../utils/cloudinaryUrl.js';
import { useRankingConfig } from '../ui/RankingProvider.jsx';
import { applyBrandPriority } from '../utils/rankingSort.js';

export default function ProductListView({ 
  title, 
  items, 
  onBack, 
  shopClosed, 
  onOpenDetails, 
  onQuickAdd, 
  cart = [], 
  onRemoveFromCart,
  onViewCart,     
  onSearchClick   
}) {
  const BOTTOM_NAV_HEIGHT = '75px';
  const { config: rankingConfig } = useRankingConfig();
  const [selectedSub, setSelectedSub] = useState("All");
  const [selectedBrand, setSelectedBrand] = useState("All Brands");
  const [selectedPriceRange, setSelectedPriceRange] = useState(null);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [brandSearchQuery, setBrandSearchQuery] = useState('');

  // 🚀 LAZY LOADING STATE: Only load 16 items at a time!
  const [visibleCount, setVisibleCount] = useState(16);

  // Cart Calculations for the floating bar
  const safeCart = Array.isArray(cart) ? cart : [];
  const cartTotalItems = safeCart.reduce((total, item) => total + (item.qty || 1), 0);
  const cartTotalPrice = safeCart.reduce((total, item) => total + ((item.sellingPrice || item.mrp || 0) * (item.qty || 1)), 0);

  // 🛡️ MOBILE BACK BUTTON FIX
  useEffect(() => {
    if (window.history.state?.name !== 'listView') {
      window.history.pushState({ name: 'listView' }, '');
    }

    const handlePopState = (e) => {
      if (e.state?.name === 'listView') {
        return; 
      }
      onBack(); 
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [onBack]);

  // Freeze background scrolling when this list opens
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // 🚀 RESET VISIBLE COUNT when changing subcategories
  useEffect(() => {
    setVisibleCount(16);
    setSelectedBrand("All Brands");
    setSelectedPriceRange(null);
  }, [selectedSub]);

  useEffect(() => {
    setVisibleCount(16);
  }, [selectedBrand, selectedPriceRange, inStockOnly, sortBy]);

  // 🚀 KEEP VARIANTS GROUPED FOR THE LIST / CATEGORY VIEW
  const sourceItems = useMemo(() => {
    return Array.isArray(items) ? items : [];
  }, [items]);

  // 🧠 SMART EXTRACTOR — strictly uses subCategory for the left sidebar.
  // Brands are never placed in the vertical sidebar; they stay in the horizontal filter bar.
  const { subcategories, groupingKey } = useMemo(() => {
    const isValid = (v) => {
      if (!v) return false;
      const s = String(v).trim();
      return s !== "" && s.toLowerCase() !== "nan";
    };

    const subs = new Set();
    sourceItems.forEach(item => {
      if (isValid(item.subCategory)) {
        const subStr = String(item.subCategory).trim();
        const catStr = String(item.category || "").trim();
        if (subStr.toLowerCase() !== catStr.toLowerCase()) {
          subs.add(subStr);
        }
      }
    });
    if (subs.size > 1) {
      return { subcategories: ["All", ...Array.from(subs)], groupingKey: "subCategory" };
    }

    return { subcategories: ["All"], groupingKey: "subCategory" };
  }, [sourceItems]);

  const hasSubcategories = subcategories.length > 1;

  // 🚀 Precompute the "best thumbnail" for each sidebar entry ONCE per items
  // change. Previously this ran inline on every render — O(subs × items)
  // each time, which made opening a category feel laggy.
  const subThumbnails = useMemo(() => {
    const map = new Map();
    if (subcategories.length === 0) return map;

    const buckets = new Map();
    buckets.set("All", sourceItems);
    sourceItems.forEach(item => {
      const key = String(item[groupingKey] || "").trim();
      if (!key) return;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(item);
    });

    subcategories.forEach(sub => {
      const bucket = buckets.get(sub) || [];
      let best = null;
      let bestDiscount = -1;
      let bestMrp = -1;
      // Single linear pass — pick the in-stock item with image that has the
      // largest discount, breaking ties on MRP. No .sort() needed.
      for (const item of bucket) {
        if (!item.image || !item.inStock) continue;
        const d = item.discountPercent || 0;
        const m = item.mrp || 0;
        if (d > bestDiscount || (d === bestDiscount && m > bestMrp)) {
          best = item;
          bestDiscount = d;
          bestMrp = m;
        }
      }
      if (!best) best = bucket[0];
      map.set(sub, best);
    });

    return map;
  }, [sourceItems, subcategories, groupingKey]);

  // 🎯 FILTER LOGIC
  const filteredItems = useMemo(() => {
    if (selectedSub === "All") return sourceItems;
    return sourceItems.filter(item => String(item[groupingKey] || "").trim() === selectedSub);
  }, [sourceItems, selectedSub, groupingKey]);

  // 🏷️ BRAND CHIPS — derived from items in the current subcategory.
  // Brands ALWAYS show in the horizontal filter bar with Sort, In-Stock, and Price.
  const brandsWithCount = useMemo(() => {
    const isValid = (v) => v && String(v).trim() && String(v).trim().toLowerCase() !== "nan";
    const map = new Map();
    filteredItems.forEach(item => {
      if (isValid(item.brand)) {
        const b = String(item.brand).trim();
        map.set(b, (map.get(b) || 0) + 1);
      }
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredItems]);

  const showBrandBar = brandsWithCount.length > 0;
  const activeBrand = showBrandBar ? selectedBrand : "All Brands";

  const finalItems = useMemo(() => {
    let list = filteredItems;

    // Filter by Brand
    if (showBrandBar && activeBrand !== "All Brands") {
      list = list.filter(item => String(item.brand || "").trim().toLowerCase() === activeBrand.toLowerCase());
    }

    // Filter by In-Stock Only
    if (inStockOnly) {
      list = list.filter(item => item.inStock !== false);
    }

    // Filter by Price Range
    if (selectedPriceRange) {
      list = list.filter(i => {
        const p = Number(i.sellingPrice !== undefined && i.sellingPrice !== null ? i.sellingPrice : (i.mrp || 0));
        if (selectedPriceRange === 'under_100') return p < 100;
        if (selectedPriceRange === '100_300') return p >= 100 && p <= 300;
        if (selectedPriceRange === '300_500') return p > 300 && p <= 500;
        if (selectedPriceRange === 'above_500') return p > 500;
        return true;
      });
    }

    // Sort
    if (sortBy === 'price_asc') {
      list = [...list].sort((a, b) => {
        const pa = Number(a.sellingPrice !== undefined && a.sellingPrice !== null ? a.sellingPrice : (a.mrp || 0));
        const pb = Number(b.sellingPrice !== undefined && b.sellingPrice !== null ? b.sellingPrice : (b.mrp || 0));
        return pa - pb;
      });
    } else if (sortBy === 'price_desc') {
      list = [...list].sort((a, b) => {
        const pa = Number(a.sellingPrice !== undefined && a.sellingPrice !== null ? a.sellingPrice : (a.mrp || 0));
        const pb = Number(b.sellingPrice !== undefined && b.sellingPrice !== null ? b.sellingPrice : (b.mrp || 0));
        return pb - pa;
      });
    } else if (sortBy === 'discount_desc') {
      list = [...list].sort((a, b) => {
        const da = a.discountPercent || 0;
        const db = b.discountPercent || 0;
        return db - da;
      });
    } else {
      list = applyBrandPriority(list, rankingConfig);
    }

    return list;
  }, [filteredItems, activeBrand, showBrandBar, inStockOnly, selectedPriceRange, sortBy, rankingConfig]);

  const hasActiveFilters = Boolean(
    (showBrandBar && activeBrand !== "All Brands") ||
    selectedPriceRange ||
    inStockOnly ||
    sortBy !== 'relevance'
  );

  const handleClearAllFilters = () => {
    setSelectedBrand("All Brands");
    setSelectedPriceRange(null);
    setInStockOnly(false);
    setSortBy('relevance');
  };

  // ⚡ INFINITE SCROLL HANDLER ⚡
  const handleScroll = (e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.target;
    // If user is within 1.5 screen lengths of the bottom, load 16 more!
    if (scrollHeight - scrollTop <= clientHeight * 1.5) {
      setVisibleCount(prev => prev + 16);
    }
  };

  return createPortal(
    <div 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: BOTTOM_NAV_HEIGHT, 
        backgroundColor: '#f4f6f8', 
        zIndex: 2000, 
        display: 'flex',
        flexDirection: 'column',
        animation: 'fadeIn 0.2s ease',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .sidebar-scroll::-webkit-scrollbar { display: none; }
        .sidebar-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      
      {/* 🌟 PREMIUM HEADER 🌟 */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: '12px 16px', zIndex: 91, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={() => window.history.back()} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#0f172a', padding: 0 }}>←</button>
          <h2 style={{ margin: 0, color: '#0f172a', fontSize: '1.15rem', fontWeight: '800', letterSpacing: '-0.3px' }}>{title}</h2>
        </div>
        {onSearchClick && (
          <button
            onClick={onSearchClick}
            aria-label="Search"
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#0f172a',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              transition: 'background-color 0.15s ease'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        )}
      </div>

      {/* 🌟 SPLIT-SCREEN CONTENT AREA 🌟 */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* ⬅️ THE LEFT SIDEBAR */}
        {hasSubcategories && (
          <div className="sidebar-scroll" style={{ width: '85px', backgroundColor: '#f8fafc', borderRight: '1px solid #e2e8f0', overflowY: 'auto', flexShrink: 0 }}>
            {subcategories.map((sub) => {
              const isActive = selectedSub === sub;
              const bestItemInSub = subThumbnails.get(sub);
              const thumbImage = bestItemInSub?.image;
              const thumbEmoji = bestItemInSub?.emoji || "🛒";

              return (
                <div
                  key={sub}
                  onClick={() => {
                    setSelectedSub(sub);
                    const grid = document.getElementById('product-grid-scroll');
                    if (grid) grid.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  style={{ padding: '12px 6px', textAlign: 'center', cursor: 'pointer', backgroundColor: isActive ? '#fff' : 'transparent', borderLeft: isActive ? '4px solid #ef4444' : '4px solid transparent', borderBottom: '1px solid #f1f5f9', transition: 'all 0.2s ease', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}
                >
                  <div style={{ width: '44px', height: '44px', backgroundColor: isActive ? '#fef2f2' : '#f1f5f9', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', border: isActive ? '1px solid #fca5a5' : '1px solid transparent', transition: 'all 0.2s ease' }}>
                    {thumbImage ? (
                      <img src={cdnImage(thumbImage, 150)} alt="" loading="lazy" decoding="async" style={{ width: '70%', height: '70%', objectFit: 'contain', mixBlendMode: 'multiply' }} />
                    ) : (
                      <span style={{ fontSize: '1.2rem' }}>{thumbEmoji}</span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.7rem', fontWeight: isActive ? '800' : '600', color: isActive ? '#ef4444' : '#64748b', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.2', width: '100%' }}>{sub}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* ➡️ THE RIGHT PRODUCT GRID (NOW WITH LAZY LOADING!) */}
        <div
          id="product-grid-scroll"
          className="sidebar-scroll"
          style={{ flex: 1, overflowY: 'auto', padding: '12px' }}
          onScroll={handleScroll} // ⚡ Scroll listener attached!
        >
          {/* 🎛️ STICKY FILTER & SORT CHIP BAR */}
          <div
            className="hide-scroll"
            style={{
              position: 'sticky',
              top: '-12px',
              marginInline: '-12px',
              marginTop: '-12px',
              marginBottom: '10px',
              padding: '8px 12px',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'saturate(180%) blur(8px)',
              WebkitBackdropFilter: 'saturate(180%) blur(8px)',
              borderBottom: '1px solid #e2e8f0',
              zIndex: 10,
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              scrollbarWidth: 'none',
              alignItems: 'center',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {/* Sort Button */}
            <button
              onClick={() => setIsSortModalOpen(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                padding: '6px 12px', borderRadius: '999px',
                fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                whiteSpace: 'nowrap', flexShrink: 0,
                backgroundColor: sortBy !== 'relevance' ? '#f0fdf4' : '#fff',
                border: sortBy !== 'relevance' ? '1.5px solid #16a34a' : '1px solid #e2e8f0',
                color: sortBy !== 'relevance' ? '#15803d' : '#334155',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                fontFamily: 'inherit',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="m3 16 4 4 4-4" /><path d="M7 20V4" /><path d="m21 8-4-4-4 4" /><path d="M17 4v16" />
              </svg>
              {sortBy === 'price_asc' ? 'Price: Low to High' :
               sortBy === 'price_desc' ? 'Price: High to Low' :
               sortBy === 'discount_desc' ? '% Discount' : 'Sort ▾'}
            </button>

            {/* In-Stock Toggle */}
            <button
              onClick={() => setInStockOnly(prev => !prev)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                padding: '6px 12px', borderRadius: '999px',
                fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                whiteSpace: 'nowrap', flexShrink: 0,
                backgroundColor: inStockOnly ? '#f0fdf4' : '#fff',
                border: inStockOnly ? '1.5px solid #16a34a' : '1px solid #e2e8f0',
                color: inStockOnly ? '#15803d' : '#334155',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                fontFamily: 'inherit',
              }}
            >
              {inStockOnly ? '✓ In-Stock' : '⚡ In-Stock'}
            </button>

            {/* Price Range Button */}
            <button
              onClick={() => setIsPriceModalOpen(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                padding: '6px 12px', borderRadius: '999px',
                fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                whiteSpace: 'nowrap', flexShrink: 0,
                backgroundColor: selectedPriceRange ? '#f0fdf4' : '#fff',
                border: selectedPriceRange ? '1.5px solid #16a34a' : '1px solid #e2e8f0',
                color: selectedPriceRange ? '#15803d' : '#334155',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                fontFamily: 'inherit',
              }}
            >
              {selectedPriceRange === 'under_100' ? 'Under ₹100' :
               selectedPriceRange === '100_300' ? '₹100 - ₹300' :
               selectedPriceRange === '300_500' ? '₹300 - ₹500' :
               selectedPriceRange === 'above_500' ? 'Above ₹500' : 'Price ▾'}
              {selectedPriceRange && (
                <span
                  onClick={(e) => { e.stopPropagation(); setSelectedPriceRange(null); }}
                  style={{ marginLeft: '4px', fontWeight: 900 }}
                >✕</span>
              )}
            </button>

            {/* Brand Dropdown Button */}
            {showBrandBar && (
              <button
                onClick={() => setIsBrandModalOpen(true)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  padding: '6px 12px', borderRadius: '999px',
                  fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                  whiteSpace: 'nowrap', flexShrink: 0,
                  backgroundColor: activeBrand !== "All Brands" ? '#f0fdf4' : '#fff',
                  border: activeBrand !== "All Brands" ? '1.5px solid #16a34a' : '1px solid #e2e8f0',
                  color: activeBrand !== "All Brands" ? '#15803d' : '#334155',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  fontFamily: 'inherit',
                }}
              >
                {activeBrand !== "All Brands" ? `Brand: ${activeBrand}` : 'Brand ▾'}
                {activeBrand !== "All Brands" && (
                  <span
                    onClick={(e) => { e.stopPropagation(); setSelectedBrand("All Brands"); }}
                    style={{ marginLeft: '4px', fontWeight: 900 }}
                  >✕</span>
                )}
              </button>
            )}

            {/* Clear All Button */}
            {hasActiveFilters && (
              <button
                onClick={handleClearAllFilters}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  padding: '6px 10px', borderRadius: '999px',
                  fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                  whiteSpace: 'nowrap', flexShrink: 0,
                  backgroundColor: '#fee2e2', border: '1px solid #fecaca',
                  color: '#b91c1c', fontFamily: 'inherit',
                }}
              >
                ✕ Clear All
              </button>
            )}
          </div>

          {finalItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🔍</div>
              <div style={{ fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>No items found</div>
              {hasActiveFilters ? (
                <div>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 14px' }}>
                    No products match the selected filters.
                  </p>
                  <button
                    onClick={handleClearAllFilters}
                    style={{
                      padding: '8px 18px', borderRadius: '999px',
                      border: 'none', background: '#16a34a', color: '#fff',
                      fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit',
                      boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)'
                    }}
                  >
                    Reset Filters
                  </button>
                </div>
              ) : showBrandBar && activeBrand !== "All Brands" ? (
                <button
                  onClick={() => setSelectedBrand("All Brands")}
                  style={{
                    marginTop: '12px', padding: '8px 16px', borderRadius: '999px',
                    border: '1px solid #16a34a', background: '#fff', color: '#16a34a',
                    fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit'
                  }}
                >
                  Show all brands
                </button>
              ) : null}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', paddingBottom: cartTotalItems > 0 ? '80px' : '20px' }}>

              {/* ⚡ ONLY MAP THE SLICED ITEMS! */}
              {finalItems.slice(0, visibleCount).map((item, index) => (
                <ModernProductCard
                  key={`${item._id}-${index}`}
                  item={item}
                  isCarousel={false}
                  shopClosed={shopClosed}
                  onOpenDetails={onOpenDetails}
                  onQuickAdd={onQuickAdd}
                  cart={cart}
                  onRemoveFromCart={onRemoveFromCart}
                />
              ))}

            </div>
          )}
        </div>
      </div>

      {/* 🔃 SORT BOTTOM SHEET MODAL */}
      {isSortModalOpen && (
        <div
          onClick={() => setIsSortModalOpen(false)}
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1000000, display: 'flex', alignItems: 'flex-end',
            animation: 'fadeIn 0.15s ease',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#fff', width: '100%',
              borderTopLeftRadius: '22px', borderTopRightRadius: '22px',
              padding: '20px 20px 30px', maxHeight: '80vh', overflowY: 'auto',
              boxShadow: '0 -4px 25px rgba(0,0,0,0.15)',
              animation: 'slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Sort By</h3>
              <button
                onClick={() => setIsSortModalOpen(false)}
                style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '1rem', color: '#64748b' }}
              >✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { id: 'relevance', label: 'Relevance (Recommended)' },
                { id: 'price_asc', label: 'Price: Low to High' },
                { id: 'price_desc', label: 'Price: High to Low' },
                { id: 'discount_desc', label: 'Discount: Highest First' },
              ].map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => { setSortBy(opt.id); setIsSortModalOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 16px', borderRadius: '14px', cursor: 'pointer',
                    backgroundColor: sortBy === opt.id ? '#f0fdf4' : '#f8fafc',
                    border: sortBy === opt.id ? '1.5px solid #16a34a' : '1px solid #e2e8f0',
                    fontWeight: sortBy === opt.id ? 700 : 600,
                    color: sortBy === opt.id ? '#15803d' : '#1e293b',
                  }}
                >
                  <span>{opt.label}</span>
                  <input
                    type="radio"
                    name="category_sort"
                    checked={sortBy === opt.id}
                    onChange={() => { setSortBy(opt.id); setIsSortModalOpen(false); }}
                    style={{ accentColor: '#16a34a', width: '18px', height: '18px' }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 💰 PRICE RANGE BOTTOM SHEET MODAL */}
      {isPriceModalOpen && (
        <div
          onClick={() => setIsPriceModalOpen(false)}
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1000000, display: 'flex', alignItems: 'flex-end',
            animation: 'fadeIn 0.15s ease',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#fff', width: '100%',
              borderTopLeftRadius: '22px', borderTopRightRadius: '22px',
              padding: '20px 20px 30px', maxHeight: '80vh', overflowY: 'auto',
              boxShadow: '0 -4px 25px rgba(0,0,0,0.15)',
              animation: 'slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Filter by Price</h3>
              <button
                onClick={() => setIsPriceModalOpen(false)}
                style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '1rem', color: '#64748b' }}
              >✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { id: null, label: 'All Prices' },
                { id: 'under_100', label: 'Under ₹100' },
                { id: '100_300', label: '₹100 - ₹300' },
                { id: '300_500', label: '₹300 - ₹500' },
                { id: 'above_500', label: 'Above ₹500' },
              ].map((opt) => (
                <div
                  key={String(opt.id)}
                  onClick={() => { setSelectedPriceRange(opt.id); setIsPriceModalOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 16px', borderRadius: '14px', cursor: 'pointer',
                    backgroundColor: selectedPriceRange === opt.id ? '#f0fdf4' : '#f8fafc',
                    border: selectedPriceRange === opt.id ? '1.5px solid #16a34a' : '1px solid #e2e8f0',
                    fontWeight: selectedPriceRange === opt.id ? 700 : 600,
                    color: selectedPriceRange === opt.id ? '#15803d' : '#1e293b',
                  }}
                >
                  <span>{opt.label}</span>
                  <input
                    type="radio"
                    name="category_price"
                    checked={selectedPriceRange === opt.id}
                    onChange={() => { setSelectedPriceRange(opt.id); setIsPriceModalOpen(false); }}
                    style={{ accentColor: '#16a34a', width: '18px', height: '18px' }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 🏷️ BRAND BOTTOM SHEET MODAL */}
      {isBrandModalOpen && (
        <div
          onClick={() => { setIsBrandModalOpen(false); setBrandSearchQuery(''); }}
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1000000, display: 'flex', alignItems: 'flex-end',
            animation: 'fadeIn 0.15s ease',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#fff', width: '100%',
              borderTopLeftRadius: '22px', borderTopRightRadius: '22px',
              padding: '20px 20px 30px', maxHeight: '80vh', overflowY: 'auto',
              boxShadow: '0 -4px 25px rgba(0,0,0,0.15)',
              animation: 'slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Filter by Brand</h3>
              <button
                onClick={() => { setIsBrandModalOpen(false); setBrandSearchQuery(''); }}
                style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '1rem', color: '#64748b' }}
              >✕</button>
            </div>

            {brandsWithCount.length > 5 && (
              <div style={{ marginBottom: '12px' }}>
                <input
                  type="text"
                  placeholder="Search brands…"
                  value={brandSearchQuery}
                  onChange={(e) => setBrandSearchQuery(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '12px',
                    border: '1px solid #e2e8f0', fontSize: '0.88rem', outline: 'none',
                    boxSizing: 'border-box', backgroundColor: '#f8fafc',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {!brandSearchQuery && (
                <div
                  onClick={() => { setSelectedBrand("All Brands"); setIsBrandModalOpen(false); setBrandSearchQuery(''); }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 16px', borderRadius: '14px', cursor: 'pointer',
                    backgroundColor: activeBrand === "All Brands" ? '#f0fdf4' : '#f8fafc',
                    border: activeBrand === "All Brands" ? '1.5px solid #16a34a' : '1px solid #e2e8f0',
                    fontWeight: activeBrand === "All Brands" ? 700 : 600,
                    color: activeBrand === "All Brands" ? '#15803d' : '#1e293b',
                  }}
                >
                  <span>All Brands</span>
                  <input
                    type="radio"
                    name="category_brand"
                    checked={activeBrand === "All Brands"}
                    onChange={() => { setSelectedBrand("All Brands"); setIsBrandModalOpen(false); setBrandSearchQuery(''); }}
                    style={{ accentColor: '#16a34a', width: '18px', height: '18px' }}
                  />
                </div>
              )}

              {brandsWithCount
                .filter(b => !brandSearchQuery || b.name.toLowerCase().includes(brandSearchQuery.toLowerCase().trim()))
                .map((b) => {
                  const isSelected = activeBrand.toLowerCase() === b.name.toLowerCase();
                  return (
                    <div
                      key={b.name}
                      onClick={() => { setSelectedBrand(b.name); setIsBrandModalOpen(false); setBrandSearchQuery(''); }}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '14px 16px', borderRadius: '14px', cursor: 'pointer',
                        backgroundColor: isSelected ? '#f0fdf4' : '#f8fafc',
                        border: isSelected ? '1.5px solid #16a34a' : '1px solid #e2e8f0',
                        fontWeight: isSelected ? 700 : 600,
                        color: isSelected ? '#15803d' : '#1e293b',
                      }}
                    >
                      <span>{b.name} <span style={{ fontSize: '0.8rem', color: isSelected ? '#166534' : '#64748b', fontWeight: 500 }}>({b.count})</span></span>
                      <input
                        type="radio"
                        name="category_brand"
                        checked={isSelected}
                        onChange={() => { setSelectedBrand(b.name); setIsBrandModalOpen(false); setBrandSearchQuery(''); }}
                        style={{ accentColor: '#16a34a', width: '18px', height: '18px' }}
                      />
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* 🌟 PREMIUM FLOATING VIEW CART BAR 🌟 */}
      {cartTotalItems > 0 && (
        <div
          onClick={() => { window.history.back(); setTimeout(() => { if (onViewCart) onViewCart(); }, 100); }} 
          style={{ position: 'fixed', bottom: `calc(${BOTTOM_NAV_HEIGHT} + 15px)`, left: '12px', right: '12px', zIndex: 99999, backgroundColor: '#16a34a', color: '#fff', padding: '12px 16px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', boxShadow: '0 8px 24px rgba(22, 163, 74, 0.3)', animation: 'fadeIn 0.2s ease' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ textAlign: 'left', lineHeight: '1.2' }}>
              <div style={{ fontWeight: '700', fontSize: '0.8rem', opacity: 0.9 }}>{cartTotalItems} ITEM{cartTotalItems > 1 ? 'S' : ''}</div>
              <div style={{ fontWeight: '900', fontSize: '1.1rem' }}>₹{cartTotalPrice}</div>
            </div>
          </div>
          <div style={{ fontWeight: '800', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>View Cart <span style={{ fontSize: '1.2rem' }}>›</span></div>
        </div>
      )}
    </div>,
    document.body
  );
}

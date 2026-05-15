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
  const BOTTOM_NAV_HEIGHT = '56px';
  const { config: rankingConfig } = useRankingConfig();
  const [selectedSub, setSelectedSub] = useState("All");
  const [selectedBrand, setSelectedBrand] = useState("All Brands");

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
  }, [selectedSub]);

  useEffect(() => {
    setVisibleCount(16);
  }, [selectedBrand]);

  // 🚀 FLATTEN THE VARIANTS FOR THE LIST VIEW
  const flattenedItems = useMemo(() => {
    return items.flatMap(item => {
      if (item.variants && item.variants.length > 0) {
        return item.variants.map(variant => ({
          ...item, 
          ...variant, 
          variants: item.variants
        }));
      }
      return item;
    });
  }, [items]);

  // 🧠 SMART EXTRACTOR — prefers subCategory, falls back to brand so the
  // sidebar still shows on categories where subCategory is empty/"nan".
  const { subcategories, groupingKey } = useMemo(() => {
    const isValid = (v) => {
      if (!v) return false;
      const s = String(v).trim();
      return s !== "" && s.toLowerCase() !== "nan";
    };

    const subs = new Set();
    flattenedItems.forEach(item => {
      if (isValid(item.subCategory)) subs.add(String(item.subCategory).trim());
    });
    if (subs.size > 0) {
      return { subcategories: ["All", ...Array.from(subs)], groupingKey: "subCategory" };
    }

    const brands = new Set();
    flattenedItems.forEach(item => {
      if (isValid(item.brand)) brands.add(String(item.brand).trim());
    });
    if (brands.size > 1) {
      return { subcategories: ["All", ...Array.from(brands)], groupingKey: "brand" };
    }

    return { subcategories: ["All"], groupingKey: "subCategory" };
  }, [flattenedItems]);

  const hasSubcategories = subcategories.length > 1;

  // 🚀 Precompute the "best thumbnail" for each sidebar entry ONCE per items
  // change. Previously this ran inline on every render — O(subs × items)
  // each time, which made opening a category feel laggy.
  const subThumbnails = useMemo(() => {
    const map = new Map();
    if (subcategories.length === 0) return map;

    const buckets = new Map();
    buckets.set("All", flattenedItems);
    flattenedItems.forEach(item => {
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
  }, [flattenedItems, subcategories, groupingKey]);

  // 🎯 FILTER LOGIC
  const filteredItems = useMemo(() => {
    if (selectedSub === "All") return flattenedItems;
    return flattenedItems.filter(item => String(item[groupingKey] || "").trim() === selectedSub);
  }, [flattenedItems, selectedSub, groupingKey]);

  // 🏷️ BRAND CHIPS — derived from items in the current subcategory.
  // Only show when sidebar isn't already grouping by brand AND there are 2+ brands.
  const brandsInView = useMemo(() => {
    if (groupingKey === "brand") return [];
    const isValid = (v) => v && String(v).trim() && String(v).trim().toLowerCase() !== "nan";
    const set = new Set();
    filteredItems.forEach(item => {
      if (isValid(item.brand)) set.add(String(item.brand).trim());
    });
    if (set.size < 2) return [];
    return ["All Brands", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [filteredItems, groupingKey]);

  const showBrandBar = brandsInView.length > 0;
  const activeBrand = showBrandBar ? selectedBrand : "All Brands";

  const finalItems = useMemo(() => {
    const base = (!showBrandBar || activeBrand === "All Brands")
      ? filteredItems
      : filteredItems.filter(item => String(item.brand || "").trim() === activeBrand);
    return applyBrandPriority(base, rankingConfig);
  }, [filteredItems, activeBrand, showBrandBar, rankingConfig]);

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
          <button onClick={onSearchClick} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#0f172a' }}>🔍</button>
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
          {/* 🏷️ BRAND FILTER CHIPS — sticky at top of grid */}
          {showBrandBar && (
            <div
              className="hide-scroll"
              style={{
                position: 'sticky',
                top: '-12px',
                marginInline: '-12px',
                marginTop: '-12px',
                marginBottom: '10px',
                padding: '10px 12px',
                background: 'rgba(244, 246, 248, 0.95)',
                backdropFilter: 'saturate(180%) blur(8px)',
                WebkitBackdropFilter: 'saturate(180%) blur(8px)',
                borderBottom: '1px solid #e2e8f0',
                zIndex: 5,
                display: 'flex',
                gap: '8px',
                overflowX: 'auto',
                scrollbarWidth: 'none'
              }}
            >
              {brandsInView.map((brand) => {
                const isActive = activeBrand === brand;
                const isAll = brand === "All Brands";
                return (
                  <button
                    key={brand}
                    onClick={() => setSelectedBrand(brand)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 14px',
                      borderRadius: '999px',
                      border: isActive ? '1px solid #16a34a' : '1px solid #e2e8f0',
                      background: isActive ? '#16a34a' : '#fff',
                      color: isActive ? '#fff' : '#0f172a',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      boxShadow: isActive ? '0 2px 8px rgba(22, 163, 74, 0.25)' : '0 1px 2px rgba(0,0,0,0.03)',
                      fontFamily: 'inherit',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {isAll && <span aria-hidden="true">🏷️</span>}
                    <span>{brand}</span>
                  </button>
                );
              })}
            </div>
          )}

          {finalItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🔍</div>
              <div style={{ fontWeight: '700' }}>No items found</div>
              {showBrandBar && activeBrand !== "All Brands" && (
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
              )}
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

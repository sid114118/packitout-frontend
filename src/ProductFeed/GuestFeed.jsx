import React, { useState, useEffect } from 'react';

export default function GuestFeed({ user, onAddToCart, selectedCategory, onClearCategory, searchQuery }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Carousel States
  const [trendingPlatform, setTrendingPlatform] = useState([]);
  const [shopDeals, setShopDeals] = useState([]);
  const [shopBestSellers, setShopBestSellers] = useState([]);
  const [under99, setUnder99] = useState([]);
  const [timeBased, setTimeBased] = useState({ title: "", items: [] });
  const [newArrivals, setNewArrivals] = useState([]);
  const [buyItAgain, setBuyItAgain] = useState([]);

  const BASE_URL = "https://darkslategrey-snail-415133.hostingersite.com";

  useEffect(() => {
    const fetchGuestProducts = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/master-products`);
        const masterData = await res.json();
        
        const formattedItems = masterData.map(p => ({ 
          ...p, sellingPrice: p.mrp, isDiscounted: false, discountPercent: 0, inStock: true 
        }));
        setItems(formattedItems);
        
        // 🛡️ SMALL DATABASE PROOF: We use slice(0, 8) so it never skips your items!
        setTrendingPlatform(formattedItems.slice(0, 8)); 
        setShopDeals([...formattedItems].reverse().slice(0, 8)); // Reversed so it looks different
        setShopBestSellers(formattedItems.slice(0, 8));
        setUnder99(formattedItems.filter(i => i.sellingPrice > 0 && i.sellingPrice < 100).slice(0, 8));
        setNewArrivals([...formattedItems].reverse().slice(0, 8)); 
        setBuyItAgain(formattedItems.slice(0, 8));

        // Smart Time-Based Logic (100% safe)
        const hour = new Date().getHours();
        let timeTitle = "";
        let keywords = [];

        if (hour >= 5 && hour < 11) {
          timeTitle = "🌤️ Good Morning! Breakfast & Dairy";
          keywords = ["dairy", "bread", "milk", "eggs", "breakfast", "tea", "coffee"];
        } else if (hour >= 11 && hour < 16) {
          timeTitle = "⚡ Mid-Day Energy Boost";
          keywords = ["snacks", "drinks", "beverages", "chips", "biscuit", "juice"];
        } else if (hour >= 16 && hour < 22) {
          timeTitle = "🌙 Evening Cravings";
          keywords = ["ice cream", "maggi", "noodles", "chocolate", "chips", "dinner"];
        } else {
          timeTitle = "🦉 Late Night Essentials";
          keywords = ["snacks", "beverages", "noodles", "condoms", "personal"];
        }

        const matchedItems = formattedItems.filter(i => {
          const cat = (i.category || "").toLowerCase();
          const name = (i.name || "").toLowerCase();
          return keywords.some(kw => cat.includes(kw) || name.includes(kw));
        });

        // If no keywords match, just show the standard items so it doesn't disappear
        setTimeBased({ 
          title: timeTitle, 
          items: matchedItems.length > 0 ? matchedItems.slice(0, 8) : formattedItems.slice(0, 8) 
        });

      } catch (err) { console.log("Guest fetch error:", err); }
      setLoading(false);
    };

    fetchGuestProducts();
  }, []);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading fresh products...</div>;

  const ProductCard = ({ item, isCarousel }) => {
    return (
      <div style={{ ...productCardStyle, minWidth: isCarousel ? '150px' : 'auto' }}>
        <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', borderRadius: '8px', marginBottom: '10px', position: 'relative' }}>
          {item.image ? <img src={item.image} style={{ maxHeight: '80px', maxWidth: '100%', objectFit: 'contain' }} alt={item.name} /> : <span style={{fontSize: '40px'}}>{item.emoji}</span>}
        </div>
        <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold', textAlign: 'left' }}>{item.brand}</div>
        <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '0.85rem', marginBottom: '5px', height: '35px', overflow: 'hidden', lineHeight: '1.2', textAlign: 'left' }}>{item.name}</div>
        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '10px', textAlign: 'left' }}>{item.qnty}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span style={{ fontWeight: '900', fontSize: '1.1rem', color: '#0f172a' }}>₹{item.sellingPrice}</span>
        </div>
        <button onClick={() => onAddToCart({ ...item, mrp: item.sellingPrice })} style={addBtnStyle}>ADD</button>
      </div>
    );
  };

  const isSearching = searchQuery && searchQuery.trim().length > 0;
  let displayItems = items;

  if (selectedCategory) {
    displayItems = items.filter(item => {
      const dbCat = (item.category || "").toLowerCase();
      const searchCat = selectedCategory.toLowerCase();
      return dbCat.includes(searchCat) || searchCat.includes(dbCat);
    });
  } else if (isSearching) {
    displayItems = items.filter(item => {
      const nameMatch = (item.name || "").toLowerCase().includes(searchQuery.toLowerCase());
      const brandMatch = (item.brand || "").toLowerCase().includes(searchQuery.toLowerCase());
      return nameMatch || brandMatch;
    });
  }

  return (
    <div style={{ padding: '0 15px', maxWidth: '1000px', margin: '0 auto', overflowX: 'hidden' }}>
      <style>{`.hide-scroll::-webkit-scrollbar { display: none; } .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }`}</style>

      {(selectedCategory || isSearching) ? (
        <div style={{ textAlign: 'left', marginTop: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '15px' }}>
            {selectedCategory && (
              <button onClick={onClearCategory} style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#334155' }}>⬅ Back</button>
            )}
            <h2 style={{ margin: 0, color: '#0f172a', fontSize: '1.4rem' }}>{isSearching ? `Search Results for "${searchQuery}"` : selectedCategory}</h2>
          </div>
          {displayItems.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', backgroundColor: 'white', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>No products found. Try a different search!</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
              {displayItems.map(item => <ProductCard key={item._id} item={item} isCarousel={false} />)}
            </div>
          )}
        </div>
      ) : (
        <>
          {trendingPlatform.length > 0 && (
            <div style={{ marginBottom: '30px', textAlign: 'left' }}>
              <h3 style={sectionHeaderStyle}>🚀 Trending on PackItOut</h3>
              <div className="hide-scroll" style={carouselRowStyle}>{trendingPlatform.map(item => <ProductCard key={item._id} item={item} isCarousel={true} />)}</div>
            </div>
          )}
          {timeBased.items.length > 0 && (
            <div style={{ marginBottom: '30px', textAlign: 'left', backgroundColor: '#e0f2fe', padding: '15px', borderRadius: '12px', border: '1px solid #bae6fd' }}>
              <h3 style={{ ...sectionHeaderStyle, color: '#0369a1' }}>{timeBased.title}</h3>
              <div className="hide-scroll" style={{ ...carouselRowStyle, paddingBottom: '5px' }}>{timeBased.items.map(item => <ProductCard key={item._id} item={item} isCarousel={true} />)}</div>
            </div>
          )}
          {shopDeals.length > 0 && (
            <div style={{ marginBottom: '30px', textAlign: 'left' }}>
              <h3 style={{ ...sectionHeaderStyle, color: '#ef4444' }}>🔥 Today's Mega Steals</h3>
              <div className="hide-scroll" style={carouselRowStyle}>{shopDeals.map(item => <ProductCard key={item._id} item={item} isCarousel={true} />)}</div>
            </div>
          )}
          {buyItAgain.length > 0 && (
            <div style={{ marginBottom: '30px', textAlign: 'left' }}>
              <h3 style={sectionHeaderStyle}>🛍️ Recommended For You</h3>
              <div className="hide-scroll" style={carouselRowStyle}>{buyItAgain.map(item => <ProductCard key={item._id} item={item} isCarousel={true} />)}</div>
            </div>
          )}
          {under99.length > 0 && (
            <div style={{ marginBottom: '30px', textAlign: 'left', backgroundColor: '#fefce8', padding: '15px', borderRadius: '12px', border: '1px solid #fef08a' }}>
              <h3 style={{ ...sectionHeaderStyle, color: '#a16207' }}>💰 The Under ₹99 Store</h3>
              <div className="hide-scroll" style={{ ...carouselRowStyle, paddingBottom: '5px' }}>{under99.map(item => <ProductCard key={item._id} item={item} isCarousel={true} />)}</div>
            </div>
          )}
          {newArrivals.length > 0 && (
            <div style={{ marginBottom: '30px', textAlign: 'left' }}>
              <h3 style={sectionHeaderStyle}>🆕 Freshly Restocked</h3>
              <div className="hide-scroll" style={carouselRowStyle}>{newArrivals.map(item => <ProductCard key={item._id} item={item} isCarousel={true} />)}</div>
            </div>
          )}
          {shopBestSellers.length > 0 && (
            <div style={{ marginBottom: '30px', textAlign: 'left' }}>
              <h3 style={sectionHeaderStyle}>👑 Top Selling Today</h3>
              <div className="hide-scroll" style={carouselRowStyle}>{shopBestSellers.map(item => <ProductCard key={item._id} item={item} isCarousel={true} />)}</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// --- CSS STYLES ---
const productCardStyle = { backgroundColor: 'white', padding: '12px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', scrollSnapAlign: 'start' };
const carouselRowStyle = { display: 'flex', overflowX: 'auto', gap: '12px', paddingBottom: '15px', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' };
const sectionHeaderStyle = { color: '#0f172a', marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' };
const addBtnStyle = { width: '100%', padding: '8px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase', boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)' };

import React, { useState, useEffect } from 'react';

// 👇 Now receives searchQuery as a prop!
export default function ProductFeed({ user, onAddToCart, selectedCategory, onClearCategory, searchQuery }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shopInfo, setShopInfo] = useState(null);

  const [shopDeals, setShopDeals] = useState([]);
  const [shopBestSellers, setShopBestSellers] = useState([]);
  const [trendingPlatform, setTrendingPlatform] = useState([]);
  const [under99, setUnder99] = useState([]);
  const [timeBased, setTimeBased] = useState({ title: "", items: [] });
  const [newArrivals, setNewArrivals] = useState([]);
  const [buyItAgain, setBuyItAgain] = useState([]);

  const BASE_URL = "https://darkslategrey-snail-415133.hostingersite.com";

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        if (user && user.primaryShop) {
          const shopId = typeof user.primaryShop === 'object' ? user.primaryShop._id : user.primaryShop;
          const res = await fetch(`${BASE_URL}/shops/${shopId}/menu?t=${new Date().getTime()}`);
          const shopData = await res.json();
          setShopInfo({ name: shopData.name, isOpen: shopData.isOpen });
          
          const availableItems = shopData.inventory?.filter(item => item.product).map(item => {
            const sellingPrice = item.sellingPrice !== undefined && item.sellingPrice !== null ? item.sellingPrice : item.product.mrp;
            return {
              ...item.product,
              sellingPrice: sellingPrice,
              isDiscounted: sellingPrice < item.product.mrp,
              discountPercent: sellingPrice < item.product.mrp ? Math.round(((item.product.mrp - sellingPrice) / item.product.mrp) * 100) : 0,
              inStock: item.inStock
            };
          }) || [];
          
          setItems(availableItems);
          setShopDeals([...availableItems].filter(i => i.isDiscounted && i.inStock).sort((a, b) => b.discountPercent - a.discountPercent).slice(0, 6));
          setShopBestSellers([...availableItems].filter(i => i.inStock).slice(0, 6));
          setUnder99([...availableItems].filter(i => i.sellingPrice > 0 && i.sellingPrice < 100 && i.inStock).slice(0, 8));
          setNewArrivals([...availableItems].reverse().filter(i => i.inStock).slice(0, 8));
          setBuyItAgain([...availableItems].filter(i => i.inStock).sort(() => 0.5 - Math.random()).slice(0, 6));

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

          const matchedItems = availableItems.filter(i => {
            const cat = (i.category || "").toLowerCase();
            const name = (i.name || "").toLowerCase();
            return i.inStock && keywords.some(kw => cat.includes(kw) || name.includes(kw));
          });

          setTimeBased({ title: timeTitle, items: matchedItems.length > 0 ? matchedItems.slice(0, 8) : availableItems.filter(i => i.inStock).slice(0, 8) });

        } else {
          setShopInfo(null);
          const res = await fetch(`${BASE_URL}/master-products`);
          const masterData = await res.json();
          const formattedItems = masterData.map(p => ({ ...p, sellingPrice: p.mrp, isDiscounted: false, discountPercent: 0, inStock: true }));
          setItems(formattedItems);
          setTrendingPlatform(formattedItems.slice(0, 6)); 
        }
      } catch (err) { console.log(err); }
      setLoading(false);
    };

    fetchProducts();
  }, [user]);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading fresh products...</div>;

  const ProductCard = ({ item, isCarousel }) => {
    const isOutOfStock = !item.inStock;
    const shopClosed = shopInfo && !shopInfo.isOpen;
    return (
      <div style={{ ...productCardStyle, minWidth: isCarousel ? '150px' : 'auto', opacity: isOutOfStock ? 0.6 : 1, filter: isOutOfStock ? 'grayscale(80%)' : 'none' }}>
        <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', borderRadius: '8px', marginBottom: '10px', position: 'relative' }}>
          {item.isDiscounted && !isOutOfStock && <div style={{ position: 'absolute', top: '-8px', left: '-8px', backgroundColor: '#ef4444', color: 'white', fontSize: '0.75rem', fontWeight: 'bold', padding: '4px 8px', borderRadius: '6px', zIndex: 10 }}>{item.discountPercent}% OFF</div>}
          {item.image ? <img src={item.image} style={{ maxHeight: '80px', maxWidth: '100%', objectFit: 'contain' }} alt={item.name} /> : <span style={{fontSize: '40px'}}>{item.emoji}</span>}
        </div>
        <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold', textAlign: 'left' }}>{item.brand}</div>
        <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '0.85rem', marginBottom: '5px', height: '35px', overflow: 'hidden', lineHeight: '1.2', textAlign: 'left' }}>{item.name}</div>
        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '10px', textAlign: 'left' }}>{item.qnty}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span style={{ fontWeight: '900', fontSize: '1.1rem', color: '#0f172a' }}>₹{item.sellingPrice}</span>
          {item.isDiscounted && <span style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: '0.8rem' }}>₹{item.mrp}</span>}
        </div>
        {isOutOfStock ? (
          <button disabled style={outOfStockBtnStyle}>OUT OF STOCK</button>
        ) : (
          <button onClick={() => onAddToCart({ ...item, mrp: item.sellingPrice })} disabled={shopClosed} style={shopClosed ? disabledBtnStyle : addBtnStyle}>{shopClosed ? "CLOSED" : "ADD"}</button>
        )}
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
      
      {shopInfo && !selectedCategory && !isSearching && (
        <div style={{ backgroundColor: '#fff', padding: '10px 20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '15px', borderRadius: '8px' }}>
          <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Shopping from:</span>
          <strong style={{ color: '#10b981' }}>{shopInfo.name}</strong>
          <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '12px', background: shopInfo.isOpen ? '#d1fae5' : '#fee2e2', color: shopInfo.isOpen ? '#059669' : '#b91c1c' }}>
            {shopInfo.isOpen ? '🟢 OPEN' : '🔴 CLOSED'}
          </span>
        </div>
      )}

      {(selectedCategory || isSearching) ? (
        
        <div style={{ textAlign: 'left', marginTop: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '15px' }}>
            {selectedCategory && (
              <button onClick={onClearCategory} style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#334155' }}>
                ⬅ Back
              </button>
            )}
            <h2 style={{ margin: 0, color: '#0f172a', fontSize: '1.4rem' }}>
              {isSearching ? `Search Results for "${searchQuery}"` : selectedCategory}
            </h2>
          </div>
          
          {displayItems.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', backgroundColor: 'white', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
              No products found. Try a different search!
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
              {displayItems.map(item => <ProductCard key={item._id} item={item} isCarousel={false} />)}
            </div>
          )}
        </div>

      ) : (

        <>
          {!shopInfo && trendingPlatform.length > 0 && (
            <div style={{ marginBottom: '30px', textAlign: 'left' }}>
              <h3 style={sectionHeaderStyle}>🚀 Trending on PackItOut</h3>
              <div className="hide-scroll" style={carouselRowStyle}>{trendingPlatform.map(item => <ProductCard key={item._id} item={item} isCarousel={true} />)}</div>
            </div>
          )}

          {shopInfo && timeBased.items.length > 0 && (
            <div style={{ marginBottom: '30px', textAlign: 'left', backgroundColor: '#e0f2fe', padding: '15px', borderRadius: '12px', border: '1px solid #bae6fd' }}>
              <h3 style={{ ...sectionHeaderStyle, color: '#0369a1' }}>{timeBased.title}</h3>
              <div className="hide-scroll" style={{ ...carouselRowStyle, paddingBottom: '5px' }}>{timeBased.items.map(item => <ProductCard key={item._id} item={item} isCarousel={true} />)}</div>
            </div>
          )}

          {shopInfo && shopDeals.length > 0 && (
            <div style={{ marginBottom: '30px', textAlign: 'left' }}>
              <h3 style={{ ...sectionHeaderStyle, color: '#ef4444' }}>🔥 {shopInfo.name} Mega Steals</h3>
              <div className="hide-scroll" style={carouselRowStyle}>{shopDeals.map(item => <ProductCard key={item._id} item={item} isCarousel={true} />)}</div>
            </div>
          )}

          {shopInfo && buyItAgain.length > 0 && (
            <div style={{ marginBottom: '30px', textAlign: 'left' }}>
              <h3 style={sectionHeaderStyle}>🛍️ Buy It Again</h3>
              <div className="hide-scroll" style={carouselRowStyle}>{buyItAgain.map(item => <ProductCard key={item._id} item={item} isCarousel={true} />)}</div>
            </div>
          )}

          {shopInfo && under99.length > 0 && (
            <div style={{ marginBottom: '30px', textAlign: 'left', backgroundColor: '#fefce8', padding: '15px', borderRadius: '12px', border: '1px solid #fef08a' }}>
              <h3 style={{ ...sectionHeaderStyle, color: '#a16207' }}>💰 The Under ₹99 Store</h3>
              <div className="hide-scroll" style={{ ...carouselRowStyle, paddingBottom: '5px' }}>{under99.map(item => <ProductCard key={item._id} item={item} isCarousel={true} />)}</div>
            </div>
          )}

          {shopInfo && newArrivals.length > 0 && (
            <div style={{ marginBottom: '30px', textAlign: 'left' }}>
              <h3 style={sectionHeaderStyle}>🆕 Freshly Restocked</h3>
              <div className="hide-scroll" style={carouselRowStyle}>{newArrivals.map(item => <ProductCard key={item._id} item={item} isCarousel={true} />)}</div>
            </div>
          )}

          {shopInfo && shopBestSellers.length > 0 && (
            <div style={{ marginBottom: '30px', textAlign: 'left' }}>
              <h3 style={sectionHeaderStyle}>👑 Top Selling Today</h3>
              <div className="hide-scroll" style={carouselRowStyle}>{shopBestSellers.map(item => <ProductCard key={item._id} item={item} isCarousel={true} />)}</div>
            </div>
          )}

          <div style={{ textAlign: 'left', borderTop: '2px solid #e2e8f0', paddingTop: '20px' }}>
            <h3 style={{ color: '#0f172a', marginBottom: '15px' }}>Explore All Products</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
              {items.map(item => <ProductCard key={item._id} item={item} isCarousel={false} />)}
            </div>
          </div>
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
const disabledBtnStyle = { width: '100%', padding: '8px', backgroundColor: '#f1f5f9', color: '#cbd5e1', border: '2px solid #cbd5e1', borderRadius: '8px', fontWeight: 'bold', cursor: 'not-allowed', textTransform: 'uppercase' };
const outOfStockBtnStyle = { width: '100%', padding: '8px', backgroundColor: '#f1f5f9', color: '#94a3b8', border: '2px solid #e2e8f0', borderRadius: '8px', fontWeight: 'bold', cursor: 'not-allowed' };
                                                                                              

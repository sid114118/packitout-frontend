import React, { useState, useEffect } from 'react';

export default function ProductFeed({ user, onAddToCart }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shopInfo, setShopInfo] = useState(null);
  
  // Custom Carousel Arrays
  const [shopDeals, setShopDeals] = useState([]);
  const [shopBestSellers, setShopBestSellers] = useState([]);
  const [trendingPlatform, setTrendingPlatform] = useState([]);

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

          // 🧮 CAROUSEL LOGIC: Top Deals (Highest discount percentage)
          const deals = [...availableItems]
            .filter(i => i.isDiscounted && i.inStock)
            .sort((a, b) => b.discountPercent - a.discountPercent)
            .slice(0, 6); // Top 6 deals
          setShopDeals(deals);

          // 🧮 CAROUSEL LOGIC: Bestsellers (In-stock essentials)
          const bestSellers = [...availableItems]
            .filter(i => i.inStock)
            .slice(0, 6); // Grabbing first 6 for now to simulate top sellers
          setShopBestSellers(bestSellers);

        } else {
          // GUEST VIEW (No shop selected)
          setShopInfo(null);
          const res = await fetch(`${BASE_URL}/master-products`);
          const masterData = await res.json();
          
          const formattedItems = masterData.map(p => ({
            ...p, sellingPrice: p.mrp, isDiscounted: false, discountPercent: 0, inStock: true
          }));
          
          setItems(formattedItems);
          
          // Show trending master items for guests
          setTrendingPlatform(formattedItems.slice(0, 6)); 
        }
      } catch (err) { console.log(err); }
      setLoading(false);
    };

    fetchProducts();
  }, [user]);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading fresh products...</div>;

  // --- REUSABLE PRODUCT CARD COMPONENT ---
  const ProductCard = ({ item, isCarousel }) => {
    const isOutOfStock = !item.inStock;
    const shopClosed = shopInfo && !shopInfo.isOpen;
    
    return (
      <div style={{ ...productCardStyle, minWidth: isCarousel ? '160px' : 'auto', opacity: isOutOfStock ? 0.6 : 1, filter: isOutOfStock ? 'grayscale(80%)' : 'none' }}>
        <div style={{ height: '110px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', borderRadius: '8px', marginBottom: '10px', position: 'relative' }}>
          {item.isDiscounted && !isOutOfStock && (
            <div style={{ position: 'absolute', top: '-8px', left: '-8px', backgroundColor: '#ef4444', color: 'white', fontSize: '0.75rem', fontWeight: 'bold', padding: '4px 8px', borderRadius: '6px', zIndex: 10 }}>
              {item.discountPercent}% OFF
            </div>
          )}
          {item.image ? <img src={item.image} style={{ maxHeight: '90px', maxWidth: '100%', objectFit: 'contain' }} alt={item.name} /> : <span style={{fontSize: '40px'}}>{item.emoji}</span>}
        </div>
        
        <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold', textAlign: 'left' }}>{item.brand}</div>
        <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '0.95rem', marginBottom: '5px', height: '40px', overflow: 'hidden', lineHeight: '1.2', textAlign: 'left' }}>{item.name}</div>
        <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '10px', textAlign: 'left' }}>{item.qnty}</div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
          <span style={{ fontWeight: '900', fontSize: '1.25rem', color: '#0f172a' }}>₹{item.sellingPrice}</span>
          {item.isDiscounted && <span style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: '0.9rem' }}>₹{item.mrp}</span>}
        </div>

        {isOutOfStock ? (
          <button disabled style={outOfStockBtnStyle}>OUT OF STOCK</button>
        ) : (
          <button onClick={() => onAddToCart({ ...item, mrp: item.sellingPrice })} disabled={shopClosed} style={shopClosed ? disabledBtnStyle : addBtnStyle}>
            {shopClosed ? "CLOSED" : "ADD"}
          </button>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: '0 15px', maxWidth: '1000px', margin: '0 auto', overflowX: 'hidden' }}>
      
      {/* 🏪 TOP SHOP BADGE */}
      {shopInfo && (
        <div style={{ backgroundColor: '#fff', padding: '10px 20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '25px', borderRadius: '8px' }}>
          <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Shopping from:</span>
          <strong style={{ color: '#10b981' }}>{shopInfo.name}</strong>
          <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '12px', background: shopInfo.isOpen ? '#d1fae5' : '#fee2e2', color: shopInfo.isOpen ? '#059669' : '#b91c1c' }}>
            {shopInfo.isOpen ? '🟢 OPEN' : '🔴 CLOSED'}
          </span>
        </div>
      )}

      {/* 🚀 CAROUSEL 1: PACKITOUT TRENDING (Only shows for guests) */}
      {!shopInfo && trendingPlatform.length > 0 && (
        <div style={{ marginBottom: '30px', textAlign: 'left' }}>
          <h3 style={{ color: '#0f172a', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>🚀 Trending on PackItOut</h3>
          <div style={carouselRowStyle}>
            {trendingPlatform.map(item => <ProductCard key={item._id} item={item} isCarousel={true} />)}
          </div>
        </div>
      )}

      {/* 🔥 CAROUSEL 2: SHOP MEGA STEALS (Only shows if shop has deals) */}
      {shopInfo && shopDeals.length > 0 && (
        <div style={{ marginBottom: '30px', textAlign: 'left' }}>
          <h3 style={{ color: '#ef4444', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>🔥 {shopInfo.name} Mega Steals</h3>
          <div style={carouselRowStyle}>
            {shopDeals.map(item => <ProductCard key={item._id} item={item} isCarousel={true} />)}
          </div>
        </div>
      )}

      {/* 👑 CAROUSEL 3: SHOP BESTSELLERS */}
      {shopInfo && shopBestSellers.length > 0 && (
        <div style={{ marginBottom: '30px', textAlign: 'left', backgroundColor: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
          <h3 style={{ color: '#0f172a', marginTop: 0, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>👑 Top Selling Today</h3>
          <div style={{ ...carouselRowStyle, paddingBottom: '5px' }}>
            {shopBestSellers.map(item => <ProductCard key={item._id} item={item} isCarousel={true} />)}
          </div>
        </div>
      )}

      {/* 📦 THE MAIN ALL-PRODUCTS GRID */}
      <div style={{ textAlign: 'left' }}>
        <h3 style={{ color: '#0f172a', marginBottom: '15px' }}>Explore All Products</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '15px' }}>
          {items.map(item => <ProductCard key={item._id} item={item} isCarousel={false} />)}
        </div>
      </div>

    </div>
  );
}

// --- CSS STYLES ---
const productCardStyle = { backgroundColor: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', scrollSnapAlign: 'start' };

// 🪄 THE HORIZONTAL SWIPE MAGIC
const carouselRowStyle = { 
  display: 'flex', 
  overflowX: 'auto', 
  gap: '15px', 
  paddingBottom: '15px', 
  scrollSnapType: 'x mandatory', 
  WebkitOverflowScrolling: 'touch',
  scrollbarWidth: 'none', // Hides scrollbar on Firefox
  msOverflowStyle: 'none', // Hides scrollbar on IE/Edge
};

const addBtnStyle = { width: '100%', padding: '10px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase', boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)' };
const disabledBtnStyle = { width: '100%', padding: '10px', backgroundColor: '#f1f5f9', color: '#cbd5e1', border: '2px solid #cbd5e1', borderRadius: '8px', fontWeight: 'bold', cursor: 'not-allowed', textTransform: 'uppercase' };
const outOfStockBtnStyle = { width: '100%', padding: '10px', backgroundColor: '#f1f5f9', color: '#94a3b8', border: '2px solid #e2e8f0', borderRadius: '8px', fontWeight: 'bold', cursor: 'not-allowed' };

// Add this CSS trick globally (or assume it works inline) to hide the ugly webkit scrollbar
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  div::-webkit-scrollbar {
    display: none;
  }
`;
document.head.appendChild(styleSheet);
                     

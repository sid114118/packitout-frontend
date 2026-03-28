import React, { useState, useEffect } from 'react';

export default function ProductFeed({ user, onAddToCart, selectedCategory, onClearCategory, searchQuery }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shopInfo, setShopInfo] = useState(null);

  const [shopDeals, setShopDeals] = useState([]);
  const [shopBestSellers, setShopBestSellers] = useState([]);
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
            const sellingPrice = item.sellingPrice || item.product.mrp;
            return {
              ...item.product,
              sellingPrice: sellingPrice,
              isDiscounted: sellingPrice < item.product.mrp,
              discountPercent: sellingPrice < item.product.mrp ? Math.round(((item.product.mrp - sellingPrice) / item.product.mrp) * 100) : 0,
              inStock: item.inStock
            };
          }) || [];
          
          setItems(availableItems);
          setShopDeals(availableItems.filter(i => i.isDiscounted && i.inStock).slice(0, 8));
          setShopBestSellers(availableItems.filter(i => i.inStock).slice(0, 8));
          setUnder99(availableItems.filter(i => i.sellingPrice < 100 && i.inStock).slice(0, 8));
          setNewArrivals([...availableItems].reverse().filter(i => i.inStock).slice(0, 8));
          setBuyItAgain([...availableItems].sort(() => 0.5 - Math.random()).slice(0, 6));

          // Time-based logic
          const hour = new Date().getHours();
          const timeTitle = hour >= 22 || hour < 5 ? "🦉 Late Night Essentials" : "🛒 Daily Essentials";
          setTimeBased({ title: timeTitle, items: availableItems.slice(0, 8) });

        } else {
          const res = await fetch(`${BASE_URL}/master-products`);
          const masterData = await res.json();
          setItems(masterData.map(p => ({ ...p, sellingPrice: p.mrp, inStock: true })));
          setShopInfo(null);
        }
      } catch (err) { console.log(err); }
      setLoading(false);
    };
    fetchProducts();
  }, [user]);

  const ProductCard = ({ item, isCarousel }) => (
    <div style={{ ...productCardStyle, minWidth: isCarousel ? '155px' : 'auto', opacity: !item.inStock ? 0.6 : 1 }}>
      <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', borderRadius: '12px', marginBottom: '8px', position: 'relative' }}>
        {item.isDiscounted && <div style={{ position: 'absolute', top: '-5px', left: '-5px', backgroundColor: '#ef4444', color: 'white', fontSize: '0.7rem', fontWeight: '900', padding: '3px 6px', borderRadius: '5px' }}>{item.discountPercent}% OFF</div>}
        <span style={{ fontSize: '2.5rem' }}>{item.emoji || "📦"}</span>
      </div>
      <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#1e293b', textAlign: 'left', height: '34px', overflow: 'hidden' }}>{item.name}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
        <span style={{ fontWeight: 'bold', color: '#0f172a' }}>₹{item.sellingPrice}</span>
        <button onClick={() => onAddToCart(item)} style={addBtnStyle}>+ Add</button>
      </div>
    </div>
  );

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Feed...</div>;

  const isSearching = searchQuery && searchQuery.trim().length > 0;

  return (
    <div style={{ padding: '0 15px' }}>
      <style>{`.hide-scroll::-webkit-scrollbar { display: none; } .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
      
      {/* Search or Category Results */}
      {(selectedCategory || isSearching) ? (
        <div style={{ textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', margin: '15px 0' }}>
            {selectedCategory && <button onClick={onClearCategory} style={backBtnStyle}>⬅ Back</button>}
            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>{isSearching ? `Results for "${searchQuery}"` : selectedCategory}</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            {items.filter(i => (selectedCategory && i.category?.toLowerCase().includes(selectedCategory.toLowerCase())) || (isSearching && i.name?.toLowerCase().includes(searchQuery.toLowerCase()))).map(item => <ProductCard key={item._id} item={item} />)}
          </div>
        </div>
      ) : (
        <>
          {/* Your Nice Carousels */}
          {shopDeals.length > 0 && <Section title="🔥 Mega Steals" items={shopDeals} render={ProductCard} />}
          {timeBased.items.length > 0 && <Section title={timeBased.title} items={timeBased.items} render={ProductCard} />}
          {under99.length > 0 && <Section title="💰 Under ₹99" items={under99} render={ProductCard} />}

          {/* 🚨 THE SAFETY NET: FULL SHOP MENU */}
          <h3 style={{ textAlign: 'left', margin: '25px 0 15px 0', fontSize: '1.1rem' }}>Shop Catalog 🏪</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            {items.map(item => <ProductCard key={item._id} item={item} />)}
          </div>
        </>
      )}
    </div>
  );
}

const Section = ({ title, items, render }) => (
  <div style={{ marginBottom: '25px', textAlign: 'left' }}>
    <h3 style={{ fontSize: '1.1rem', marginBottom: '12px', fontWeight: '800' }}>{title}</h3>
    <div className="hide-scroll" style={{ display: 'flex', overflowX: 'auto', gap: '12px', paddingBottom: '10px' }}>
      {items.map(i => render({ item: i, isCarousel: true }))}
    </div>
  </div>
);

const productCardStyle = { backgroundColor: 'white', padding: '12px', borderRadius: '16px', border: '1px solid #e2e8f0' };
const addBtnStyle = { backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 12px', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' };
const backBtnStyle = { padding: '8px 15px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };

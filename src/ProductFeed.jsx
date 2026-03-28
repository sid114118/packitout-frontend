import React, { useState, useEffect } from 'react';

export default function ProductFeed({ user, onAddToCart, selectedCategory, onClearCategory, searchQuery }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shopInfo, setShopInfo] = useState(null);
  const [debugInfo, setDebugInfo] = useState(""); // 🕵️‍♂️ Debug helper

  const [shopDeals, setShopDeals] = useState([]);
  const [timeBased, setTimeBased] = useState({ title: "", items: [] });
  const [under99, setUnder99] = useState([]);

  const BASE_URL = "https://darkslategrey-snail-415133.hostingersite.com";

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // 1. Check if we have a user and a shop
        if (user && user.primaryShop) {
          const shopId = typeof user.primaryShop === 'object' ? user.primaryShop._id : user.primaryShop;
          
          setDebugInfo(`Fetching for Shop ID: ${shopId}`);

          const res = await fetch(`${BASE_URL}/shops/${shopId}/menu?t=${new Date().getTime()}`);
          const shopData = await res.json();

          if (!shopData || !shopData.inventory) {
            setDebugInfo(`Error: Shop found but inventory is missing or empty.`);
          }

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
          
          if (availableItems.length === 0) {
            setDebugInfo(`Success! Connected to ${shopData.name}, but inventory filtered to 0 items. Check if products are linked in Admin.`);
          } else {
            setDebugInfo(`Loaded ${availableItems.length} items successfully!`);
          }

          setShopDeals(availableItems.filter(i => i.isDiscounted && i.inStock).slice(0, 8));
          setUnder99(availableItems.filter(i => i.sellingPrice < 100 && i.inStock).slice(0, 8));
          
          const hour = new Date().getHours();
          setTimeBased({ 
            title: hour < 12 ? "🌤️ Breakfast Essentials" : "🌙 Evening Cravings", 
            items: availableItems.slice(0, 6) 
          });

        } else {
          setDebugInfo("No Shop selected. Loading Master Catalog...");
          const res = await fetch(`${BASE_URL}/master-products`);
          const masterData = await res.json();
          setItems(masterData.map(p => ({ ...p, sellingPrice: p.mrp, inStock: true })));
          setShopInfo(null);
        }
      } catch (err) { 
        setDebugInfo(`Fetch Failed: ${err.message}`);
      }
      setLoading(false);
    };
    fetchProducts();
  }, [user]);

  const ProductCard = ({ item, isCarousel }) => (
    <div style={{ ...productCardStyle, minWidth: isCarousel ? '150px' : 'auto' }}>
      <div style={{ height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', borderRadius: '10px', marginBottom: '10px' }}>
        <span style={{fontSize: '35px'}}>{item.emoji || "📦"}</span>
      </div>
      <div style={{ fontWeight: 'bold', fontSize: '0.8rem', textAlign: 'left', height: '32px', overflow: 'hidden' }}>{item.name}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
        <span style={{ fontWeight: 'bold' }}>₹{item.sellingPrice}</span>
        <button onClick={() => onAddToCart(item)} style={addBtnStyle}>+ Add</button>
      </div>
    </div>
  );

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Feed...</div>;

  return (
    <div style={{ padding: '0 15px' }}>
      
      {/* 🕵️‍♂️ DEBUGGER: Delete this div once the feed is working! */}
      <div style={{ fontSize: '10px', color: '#ef4444', backgroundColor: '#fee2e2', padding: '5px', borderRadius: '5px', marginBottom: '10px', textAlign: 'left' }}>
        <strong>Debug:</strong> {debugInfo}
      </div>

      {/* --- Main Carousels --- */}
      {!selectedCategory && !searchQuery && (
        <>
          {shopDeals.length > 0 && <Section title="🔥 Mega Steals" items={shopDeals} render={ProductCard} />}
          {timeBased.items.length > 0 && <Section title={timeBased.title} items={timeBased.items} render={ProductCard} />}
        </>
      )}

      {/* --- Full Catalog Section --- */}
      <h3 style={{ textAlign: 'left', margin: '20px 0 10px 0', fontSize: '1.1rem' }}>
        {selectedCategory || (searchQuery ? `Results for "${searchQuery}"` : "Shop Catalog 🏪")}
      </h3>

      {items.length === 0 ? (
        <div style={{ padding: '30px', background: 'white', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b' }}>
          No products found in this shop yet.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', paddingBottom: '30px' }}>
          {items.filter(i => {
            if (selectedCategory) return i.category?.toLowerCase().includes(selectedCategory.toLowerCase());
            if (searchQuery) return i.name?.toLowerCase().includes(searchQuery.toLowerCase());
            return true;
          }).map(item => <ProductCard key={item._id} item={item} />)}
        </div>
      )}
    </div>
  );
}

const Section = ({ title, items, render }) => (
  <div style={{ marginBottom: '25px', textAlign: 'left' }}>
    <h3 style={{ fontSize: '1rem', marginBottom: '10px', fontWeight: 'bold' }}>{title}</h3>
    <div style={{ display: 'flex', overflowX: 'auto', gap: '12px', paddingBottom: '10px' }}>
      {items.map(i => render({ item: i, isCarousel: true }))}
    </div>
  </div>
);

const productCardStyle = { backgroundColor: 'white', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' };
const addBtnStyle = { backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', padding: '5px 10px', fontWeight: 'bold', fontSize: '0.75rem' };

import React, { useState, useEffect } from 'react';
import ProductModal from './ProductModal.jsx';
import { VariantBottomSheet, ModernProductCard, ProductRow } from './FeedComponents.jsx'; // 👈 LOOK HOW CLEAN THIS IS!

export default function ShopFeed({ user, onAddToCart, cart = [], selectedCategory, onClearCategory, searchQuery }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shopInfo, setShopInfo] = useState(null);
  const [nearbyShops, setNearbyShops] = useState([]);
  
  const [selectedProductDetails, setSelectedProductDetails] = useState(null); 
  const [selectedVariantProduct, setSelectedVariantProduct] = useState(null);
  const [viewAll, setViewAll] = useState(null); 

  const [shopDeals, setShopDeals] = useState([]);
  const [shopBestSellers, setShopBestSellers] = useState([]);
  const [under99, setUnder99] = useState([]);
  const [timeBased, setTimeBased] = useState({ title: "", subtitle: "", items: [] });
  const [newArrivals, setNewArrivals] = useState([]);
  const [buyItAgain, setBuyItAgain] = useState([]);

  const BASE_URL = "https://darkslategrey-snail-415133.hostingersite.com";

  useEffect(() => {
    const fetchShopProducts = async () => {
      setLoading(true);
      try {
        const shopId = typeof user.primaryShop === 'object' ? user.primaryShop._id : user.primaryShop;
        const res = await fetch(`${BASE_URL}/shops/${shopId}/menu?t=${new Date().getTime()}`);
        const shopData = await res.json();
        setShopInfo({ name: shopData.name, isOpen: shopData.isOpen });
        
        if (user && user.pincode) {
          const shopsRes = await fetch(`${BASE_URL}/shops/all/${user.pincode}`);
          const shopsData = await shopsRes.json();
          setNearbyShops(shopsData.filter(s => s._id !== shopId)); 
        }

        const groupedMap = new Map();
        const availableItems = [];

        shopData.inventory?.filter(item => item.product).forEach(item => {
          const sellingPrice = item.sellingPrice !== undefined && item.sellingPrice !== null ? item.sellingPrice : item.product.mrp;
          const formattedItem = {
            ...item.product, sellingPrice, inStock: item.inStock,
            isDiscounted: sellingPrice < item.product.mrp,
            discountPercent: sellingPrice < item.product.mrp ? Math.round(((item.product.mrp - sellingPrice) / item.product.mrp) * 100) : 0,
          };

          if (formattedItem.itemGroupId && formattedItem.itemGroupId.trim() !== "") {
            const groupId = String(formattedItem.itemGroupId).trim().toUpperCase();
            if (!groupedMap.has(groupId)) {
              formattedItem.variants = [formattedItem]; 
              groupedMap.set(groupId, formattedItem);
              availableItems.push(formattedItem);
            } else {
              groupedMap.get(groupId).variants.push(formattedItem);
            }
          } else {
            availableItems.push(formattedItem);
          }
        });
        
        setItems(availableItems);
        setShopDeals([...availableItems].filter(i => i.isDiscounted && i.inStock).sort((a, b) => b.discountPercent - a.discountPercent).slice(0, 12));
        setShopBestSellers([...availableItems].filter(i => i.inStock).slice(0, 12));
        setUnder99([...availableItems].filter(i => i.sellingPrice > 0 && i.sellingPrice < 100 && i.inStock).slice(0, 12));
        setNewArrivals([...availableItems].reverse().filter(i => i.inStock).slice(0, 12));
        setBuyItAgain([...availableItems].filter(i => i.inStock).sort(() => 0.5 - Math.random()).slice(0, 12));

        const hour = new Date().getHours();
        let timeTitle = ""; let timeSubtitle = ""; let keywords = [];
        if (hour >= 5 && hour < 11) { timeTitle = "🌤️ Breakfast & Dairy"; timeSubtitle = "Start your morning right"; keywords = ["dairy", "bread", "milk", "eggs", "breakfast"]; } 
        else if (hour >= 11 && hour < 16) { timeTitle = "⚡ Mid-Day Energy Boost"; timeSubtitle = "Keep the momentum going"; keywords = ["snacks", "drinks", "beverages", "chips"]; } 
        else if (hour >= 16 && hour < 22) { timeTitle = "🌙 Evening Cravings"; timeSubtitle = "Perfect time for a snack"; keywords = ["ice cream", "maggi", "noodles", "chocolate"]; } 
        else { timeTitle = "🦉 Late Night Essentials"; timeSubtitle = "We are still awake for you"; keywords = ["snacks", "beverages", "noodles", "condoms"]; }

        const matchedItems = availableItems.filter(i => i.inStock && keywords.some(kw => (i.category || "").toLowerCase().includes(kw) || (i.name || "").toLowerCase().includes(kw)));
        setTimeBased({ title: timeTitle, subtitle: timeSubtitle, items: matchedItems.length > 0 ? matchedItems.slice(0, 12) : availableItems.filter(i => i.inStock).slice(0, 12) });

      } catch (err) { console.log(err); }
      setLoading(false);
    };

    fetchShopProducts();
  }, [user]);

  const handleSwitchShop = async (newShop) => {
    if (!window.confirm(`Switch to ${newShop.name}? This will clear your current cart.`)) return;
    try {
      const res = await fetch(`${BASE_URL}/users/${user._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ primaryShop: newShop._id }) });
      localStorage.setItem("packitout_user", JSON.stringify(await res.json()));
      window.location.reload();
    } catch (err) { alert("Failed to switch shop."); }
  };

  // 👇 The Centralized Click Handler!
  const handleQuickAdd = (item) => {
    if (item.variants && item.variants.length > 1) setSelectedVariantProduct(item);
    else onAddToCart({ ...item, mrp: item.sellingPrice });
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Loading fresh products...</div>;

  const isSearching = searchQuery && searchQuery.trim().length > 0;
  let displayItems = items;
  if (isSearching) displayItems = items.filter(i => (i.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || (i.brand || "").toLowerCase().includes(searchQuery.toLowerCase()));
  else if (viewAll) displayItems = viewAll.items;
  else if (selectedCategory) displayItems = items.filter(i => (i.category || "").toLowerCase().includes(selectedCategory.toLowerCase()));

  const shopClosed = shopInfo && !shopInfo.isOpen;

  return (
    <div style={{ padding: '0', maxWidth: '1000px', margin: '0 auto', overflowX: 'hidden', backgroundColor: '#f3f4f6' }}>
      <style>{`.hide-scroll::-webkit-scrollbar { display: none; } .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }`}</style>

      {(selectedCategory || isSearching || viewAll) ? (
        <div style={{ padding: '15px', backgroundColor: '#fff', minHeight: '100vh' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '15px' }}>
            <button onClick={() => { if (selectedCategory) onClearCategory(); setViewAll(null); }} style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#334155' }}>⬅ Back</button>
            <h2 style={{ margin: 0, color: '#0f172a', fontSize: '1.2rem' }}>{isSearching ? `Results for "${searchQuery}"` : (viewAll ? viewAll.title : selectedCategory)}</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
            {displayItems.map(item => <ModernProductCard key={item._id} item={item} isCarousel={false} shopClosed={shopClosed} onOpenDetails={setSelectedProductDetails} onQuickAdd={handleQuickAdd} />)}
          </div>
        </div>
      ) : (
        <>
          <ProductRow title={timeBased.title} subtitle={timeBased.subtitle} items={timeBased.items} onViewAll={setViewAll} shopClosed={shopClosed} onOpenDetails={setSelectedProductDetails} onQuickAdd={handleQuickAdd} />
          <ProductRow title="Price Crash" subtitle="Extra Savings" items={shopDeals} onViewAll={setViewAll} shopClosed={shopClosed} onOpenDetails={setSelectedProductDetails} onQuickAdd={handleQuickAdd} />
          <ProductRow title="Top Picks for You" subtitle="Based on what is popular around you" items={shopBestSellers} onViewAll={setViewAll} shopClosed={shopClosed} onOpenDetails={setSelectedProductDetails} onQuickAdd={handleQuickAdd} />
          <ProductRow title="The Under ₹99 Store" subtitle="Budget friendly grabs" items={under99} onViewAll={setViewAll} shopClosed={shopClosed} onOpenDetails={setSelectedProductDetails} onQuickAdd={handleQuickAdd} />
          <ProductRow title="Buy It Again" subtitle="Your recent favorites" items={buyItAgain} onViewAll={setViewAll} shopClosed={shopClosed} onOpenDetails={setSelectedProductDetails} onQuickAdd={handleQuickAdd} />
          <ProductRow title="Freshly Restocked" subtitle="Back on the shelves" items={newArrivals} onViewAll={setViewAll} shopClosed={shopClosed} onOpenDetails={setSelectedProductDetails} onQuickAdd={handleQuickAdd} />

          {nearbyShops.length > 0 && (
            <div style={{ padding: '20px 15px', backgroundColor: '#fff', marginTop: '10px' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#111827', marginBottom: '15px' }}>🏪 Explore Nearby Stores</h3>
              <div className="hide-scroll" style={{ display: 'flex', overflowX: 'auto', gap: '12px', paddingBottom: '10px' }}>
                {nearbyShops.map(shop => (
                  <div key={shop._id} style={{ minWidth: '160px', padding: '15px', border: '1px solid #e5e7eb', borderRadius: '12px', textAlign: 'center', backgroundColor: '#f9fafb' }}>
                    <div style={{ fontSize: '30px', marginBottom: '8px' }}>🏪</div>
                    <div style={{ fontWeight: 'bold', color: '#111827', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{shop.name}</div>
                    <div style={{ fontSize: '0.75rem', color: shop.isOpen ? '#10b981' : '#ef4444', fontWeight: 'bold', margin: '5px 0 12px 0' }}>{shop.isOpen ? '🟢 OPEN' : '🔴 CLOSED'}</div>
                    <button onClick={() => handleSwitchShop(shop)} style={{ width: '100%', padding: '8px', backgroundColor: '#111827', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Visit Store</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* REUSABLE UI MAGIC ✨ */}
      <VariantBottomSheet product={selectedVariantProduct} onClose={() => setSelectedVariantProduct(null)} onAddToCart={onAddToCart} />
      <ProductModal product={selectedProductDetails} isOpen={selectedProductDetails !== null} onClose={() => setSelectedProductDetails(null)} onAddToCart={onAddToCart} cart={cart} allItems={items} />
    </div>
  );
}

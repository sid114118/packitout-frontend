import React, { useState, useEffect } from 'react';
import ProductModal from './ProductModal.jsx';
import { VariantBottomSheet, ModernProductCard, ProductRow } from './FeedComponents.jsx'; // 👈 Centralized UI Imports!

export default function GuestFeed({ user, onAddToCart, selectedCategory, onClearCategory, searchQuery }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal & View States
  const [selectedProductDetails, setSelectedProductDetails] = useState(null); 
  const [selectedVariantProduct, setSelectedVariantProduct] = useState(null);
  const [viewAll, setViewAll] = useState(null); 

  // Carousel States
  const [trendingPlatform, setTrendingPlatform] = useState([]);
  const [shopDeals, setShopDeals] = useState([]);
  const [shopBestSellers, setShopBestSellers] = useState([]);
  const [under99, setUnder99] = useState([]);
  const [timeBased, setTimeBased] = useState({ title: "", subtitle: "", items: [] });
  const [newArrivals, setNewArrivals] = useState([]);
  const [buyItAgain, setBuyItAgain] = useState([]);

  const BASE_URL = "https://darkslategrey-snail-415133.hostingersite.com";

  useEffect(() => {
    const fetchGuestProducts = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/master-products`);
        const masterData = await res.json();
        
        // 🛡️ BULLETPROOF GROUPING LOGIC
        const groupedMap = new Map();
        const finalItems = [];

        masterData.forEach(p => {
          const formattedItem = { 
            ...p, 
            sellingPrice: p.mrp, 
            isDiscounted: false, 
            discountPercent: 0, 
            inStock: true, // Guests always see items as in-stock
            variants: [] 
          };

          const groupId = p.itemGroupId ? String(p.itemGroupId).trim().toUpperCase() : null;

          if (groupId && groupId !== "") {
            if (!groupedMap.has(groupId)) {
              formattedItem.variants.push(formattedItem); 
              groupedMap.set(groupId, formattedItem);
              finalItems.push(formattedItem);
            } else {
              groupedMap.get(groupId).variants.push(formattedItem);
            }
          } else {
            finalItems.push(formattedItem);
          }
        });
        
        setItems(finalItems);
        
        // Slice the grouped items for the guest feed sections
        setTrendingPlatform(finalItems.slice(0, 8)); 
        setShopDeals([...finalItems].reverse().slice(0, 8)); 
        setShopBestSellers(finalItems.slice(0, 8));
        setUnder99(finalItems.filter(i => i.sellingPrice > 0 && i.sellingPrice < 100).slice(0, 8));
        setNewArrivals([...finalItems].reverse().slice(0, 8)); 
        setBuyItAgain(finalItems.slice(0, 8));

        // Smart Time-Based Logic
        const hour = new Date().getHours();
        let timeTitle = ""; let timeSubtitle = ""; let keywords = [];

        if (hour >= 5 && hour < 11) {
          timeTitle = "🌤️ Breakfast & Dairy"; timeSubtitle = "Start your morning right";
          keywords = ["dairy", "bread", "milk", "eggs", "breakfast", "tea", "coffee"];
        } else if (hour >= 11 && hour < 16) {
          timeTitle = "⚡ Mid-Day Energy Boost"; timeSubtitle = "Keep the momentum going";
          keywords = ["snacks", "drinks", "beverages", "chips", "biscuit", "juice"];
        } else if (hour >= 16 && hour < 22) {
          timeTitle = "🌙 Evening Cravings"; timeSubtitle = "Perfect time for a snack";
          keywords = ["ice cream", "maggi", "noodles", "chocolate", "chips", "dinner"];
        } else {
          timeTitle = "🦉 Late Night Essentials"; timeSubtitle = "We are still awake for you";
          keywords = ["snacks", "beverages", "noodles", "condoms", "personal"];
        }

        const matchedItems = finalItems.filter(i => {
          const cat = (i.category || "").toLowerCase();
          const name = (i.name || "").toLowerCase();
          return keywords.some(kw => cat.includes(kw) || name.includes(kw));
        });

        setTimeBased({ 
          title: timeTitle, 
          subtitle: timeSubtitle,
          items: matchedItems.length > 0 ? matchedItems.slice(0, 8) : finalItems.slice(0, 8) 
        });

      } catch (err) { console.log("Guest fetch error:", err); }
      setLoading(false);
    };

    fetchGuestProducts();
  }, []);

  // 👇 The Centralized Click Handler!
  const handleQuickAdd = (item) => {
    if (item.variants && item.variants.length > 1) setSelectedVariantProduct(item);
    else onAddToCart({ ...item, mrp: item.sellingPrice });
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Loading fresh products...</div>;

  const isSearching = searchQuery && searchQuery.trim().length > 0;
  let displayItems = items;

  if (isSearching) {
    displayItems = items.filter(item => {
      const nameMatch = (item.name || "").toLowerCase().includes(searchQuery.toLowerCase());
      const brandMatch = (item.brand || "").toLowerCase().includes(searchQuery.toLowerCase());
      return nameMatch || brandMatch;
    });
  } else if (viewAll) {
    displayItems = viewAll.items;
  } else if (selectedCategory) {
    displayItems = items.filter(item => {
      const dbCat = (item.category || "").toLowerCase();
      const searchCat = selectedCategory.toLowerCase();
      return dbCat.includes(searchCat) || searchCat.includes(dbCat);
    });
  }

  return (
    <div style={{ padding: '0', maxWidth: '1000px', margin: '0 auto', overflowX: 'hidden', backgroundColor: '#f3f4f6' }}>
      <style>{`.hide-scroll::-webkit-scrollbar { display: none; } .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }`}</style>

      {(selectedCategory || isSearching || viewAll) ? (
        <div style={{ padding: '15px', backgroundColor: '#fff', minHeight: '100vh' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '15px' }}>
            <button 
              onClick={() => {
                if (selectedCategory) onClearCategory();
                setViewAll(null);
              }} 
              style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#334155' }}
            >
              ⬅ Back
            </button>
            <h2 style={{ margin: 0, color: '#0f172a', fontSize: '1.2rem' }}>
              {isSearching ? `Results for "${searchQuery}"` : (viewAll ? viewAll.title : selectedCategory)}
            </h2>
          </div>

          {displayItems.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>No products found.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
              {/* Using imported ModernProductCard */}
              {displayItems.map(item => <ModernProductCard key={item._id} item={item} isCarousel={false} shopClosed={false} onOpenDetails={setSelectedProductDetails} onQuickAdd={handleQuickAdd} />)}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Using imported ProductRow */}
          <ProductRow title="🚀 Trending on PackItOut" subtitle="What everyone is ordering" items={trendingPlatform} onViewAll={setViewAll} shopClosed={false} onOpenDetails={setSelectedProductDetails} onQuickAdd={handleQuickAdd} />
          <ProductRow title={timeBased.title} subtitle={timeBased.subtitle} items={timeBased.items} onViewAll={setViewAll} shopClosed={false} onOpenDetails={setSelectedProductDetails} onQuickAdd={handleQuickAdd} />
          <ProductRow title="🔥 Today's Mega Steals" subtitle="Unbeatable prices" items={shopDeals} onViewAll={setViewAll} shopClosed={false} onOpenDetails={setSelectedProductDetails} onQuickAdd={handleQuickAdd} />
          <ProductRow title="🛍️ Recommended For You" subtitle="Top picks for guests" items={buyItAgain} onViewAll={setViewAll} shopClosed={false} onOpenDetails={setSelectedProductDetails} onQuickAdd={handleQuickAdd} />
          <ProductRow title="💰 The Under ₹99 Store" subtitle="Budget friendly grabs" items={under99} onViewAll={setViewAll} shopClosed={false} onOpenDetails={setSelectedProductDetails} onQuickAdd={handleQuickAdd} />
          <ProductRow title="🆕 Freshly Restocked" subtitle="Back on the shelves" items={newArrivals} onViewAll={setViewAll} shopClosed={false} onOpenDetails={setSelectedProductDetails} onQuickAdd={handleQuickAdd} />
          <ProductRow title="👑 Top Selling Today" subtitle="Customer favorites" items={shopBestSellers} onViewAll={setViewAll} shopClosed={false} onOpenDetails={setSelectedProductDetails} onQuickAdd={handleQuickAdd} />
        </>
      )}

      {/* REUSABLE UI MAGIC ✨ */}
      <VariantBottomSheet product={selectedVariantProduct} onClose={() => setSelectedVariantProduct(null)} onAddToCart={onAddToCart} />
      
      <ProductModal 
        product={selectedProductDetails} 
        isOpen={selectedProductDetails !== null} 
        onClose={() => setSelectedProductDetails(null)} 
        onAddToCart={(item) => {
          onAddToCart({ ...item, mrp: item.sellingPrice });
          setSelectedProductDetails(null); 
        }}
        cart={[]} 
        allItems={items} 
      />
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import ProductModal from './ProductModal.jsx';
import ProductListView from './ProductListView.jsx'; 

// 🟢 STEP OUT OF THE FOLDER TO GRAB THE SEARCH PAGE
import SearchPage from '../SearchPage.jsx'; 

import { VariantBottomSheet, ModernProductCard, ProductRow } from './FeedComponents.jsx';

export default function GuestFeed({ 
  user, onAddToCart, onRemoveFromCart, onViewCart, cart = [], 
  selectedCategory, onClearCategory, 
  
  // 🟢 Search Triggers from App.jsx
  isSearchOpen, onOpenSearch, onCloseSearch 
}) {
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

  const BASE_URL = (import.meta.env.VITE_API_BASE || "https://darkslategrey-snail-415133.hostingersite.com");

  useEffect(() => {
    const fetchGuestProducts = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/master-products`);
        const masterData = await res.json();
        
        const groupedMap = new Map();
        const finalItems = [];

        masterData.forEach(p => {
          const formattedItem = { 
            ...p, 
            sellingPrice: p.mrp, 
            isDiscounted: false, 
            discountPercent: 0, 
            inStock: true, 
            variants: [] 
          };

          // 🛡️ THE FIX: Safely check for group IDs and ignore "nan"
          const rawId = p.itemGroupId ? String(p.itemGroupId).trim().toLowerCase() : "";
          const groupId = (rawId === "" || rawId === "nan") ? null : rawId;

          if (groupId) {
            if (!groupedMap.has(groupId)) {
              formattedItem.variants = [formattedItem]; 
              groupedMap.set(groupId, formattedItem);
              finalItems.push(formattedItem);
            } else {
              groupedMap.get(groupId).variants.push(formattedItem);
            }
          } else {
            // No valid group ID? Just push it normally!
            formattedItem.variants = [formattedItem];
            finalItems.push(formattedItem);
          }
        });
        
        setItems(finalItems);
        
        setTrendingPlatform(finalItems.slice(0, 8)); 
        setShopDeals([...finalItems].reverse().slice(0, 8)); 
        setShopBestSellers(finalItems.slice(0, 8));
        setUnder99(finalItems.filter(i => i.sellingPrice > 0 && i.sellingPrice < 100).slice(0, 8));
        setNewArrivals([...finalItems].reverse().slice(0, 8)); 
        setBuyItAgain(finalItems.slice(0, 8));

        // 🕒 CLEVER SHOPKEEPER LOGIC: Time of Day Merchandising
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

  const handleQuickAdd = (item) => {
    if (item.variants && item.variants.length > 1) setSelectedVariantProduct(item);
    else onAddToCart({ ...item, mrp: item.sellingPrice });
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Loading fresh products...</div>;

  let displayItems = items;
  if (viewAll) {
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
      
      {/* 🌟 1. THE DEDICATED SEARCH PAGE OVERLAY 🌟 */}
      {isSearchOpen && (
        <SearchPage 
          items={items}
          onClose={onCloseSearch}
          onOpenDetails={setSelectedProductDetails}
          onQuickAdd={handleQuickAdd}
          cart={cart}
          onRemoveFromCart={onRemoveFromCart}
          onViewCart={onViewCart}
        />
      )}

      {/* 🌟 2. CATEGORY & VIEW ALL OVERLAY 🌟 */}
      {(viewAll || selectedCategory) && !isSearchOpen && (
        <ProductListView
          title={viewAll ? viewAll.title : selectedCategory}
          items={displayItems}
          onBack={() => { if (selectedCategory) onClearCategory(); setViewAll(null); }}
          shopClosed={false}
          onOpenDetails={setSelectedProductDetails}
          onQuickAdd={handleQuickAdd}
          cart={cart} 
          onRemoveFromCart={onRemoveFromCart} 
          onViewCart={onViewCart} 
          onSearchClick={() => {  
             if (selectedCategory) onClearCategory(); 
             setViewAll(null); 
             onOpenSearch(); 
          }}
        />
      )}

      {/* 🌟 3. NORMAL FEED 🌟 */}
      {!isSearchOpen && !viewAll && !selectedCategory && (
        <>
          <ProductRow title="🚀 Trending on PackItOut" subtitle="What everyone is ordering" items={trendingPlatform} onViewAll={setViewAll} shopClosed={false} onOpenDetails={setSelectedProductDetails} onQuickAdd={handleQuickAdd} cart={cart} onRemoveFromCart={onRemoveFromCart} />
          <ProductRow title={timeBased.title} subtitle={timeBased.subtitle} items={timeBased.items} onViewAll={setViewAll} shopClosed={false} onOpenDetails={setSelectedProductDetails} onQuickAdd={handleQuickAdd} cart={cart} onRemoveFromCart={onRemoveFromCart} />
          <ProductRow title="🔥 Today's Mega Steals" subtitle="Unbeatable prices" items={shopDeals} onViewAll={setViewAll} shopClosed={false} onOpenDetails={setSelectedProductDetails} onQuickAdd={handleQuickAdd} cart={cart} onRemoveFromCart={onRemoveFromCart} />
          <ProductRow title="🛍️ Recommended For You" subtitle="Top picks for guests" items={buyItAgain} onViewAll={setViewAll} shopClosed={false} onOpenDetails={setSelectedProductDetails} onQuickAdd={handleQuickAdd} cart={cart} onRemoveFromCart={onRemoveFromCart} />
          <ProductRow title="💰 The Under ₹99 Store" subtitle="Budget friendly grabs" items={under99} onViewAll={setViewAll} shopClosed={false} onOpenDetails={setSelectedProductDetails} onQuickAdd={handleQuickAdd} cart={cart} onRemoveFromCart={onRemoveFromCart} />
          <ProductRow title="🆕 Freshly Restocked" subtitle="Back on the shelves" items={newArrivals} onViewAll={setViewAll} shopClosed={false} onOpenDetails={setSelectedProductDetails} onQuickAdd={handleQuickAdd} cart={cart} onRemoveFromCart={onRemoveFromCart} />
          <ProductRow title="👑 Top Selling Today" subtitle="Customer favorites" items={shopBestSellers} onViewAll={setViewAll} shopClosed={false} onOpenDetails={setSelectedProductDetails} onQuickAdd={handleQuickAdd} cart={cart} onRemoveFromCart={onRemoveFromCart} />
          
          <div style={{ textAlign: 'center', padding: '10px 0 40px 0', color: '#94a3b8', fontSize: '0.8rem', fontWeight: '600' }}>
            Sign in to see nearby shops! 🚀
          </div>
        </>
      )}

      <VariantBottomSheet product={selectedVariantProduct} onClose={() => setSelectedVariantProduct(null)} onAddToCart={onAddToCart} />
      
      <ProductModal 
        product={selectedProductDetails} 
        isOpen={selectedProductDetails !== null} 
        onClose={() => setSelectedProductDetails(null)} 
        onAddToCart={(item) => {
          onAddToCart({ ...item, mrp: item.sellingPrice });
        }}
        onRemoveFromCart={onRemoveFromCart}
        onViewCart={onViewCart}
        cart={cart} 
        allItems={items} 
      />
    </div>
  );
    }

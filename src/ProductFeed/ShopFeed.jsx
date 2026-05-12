import React, { useState } from 'react';
import ProductModal from './ProductModal.jsx';
import ProductListView from './ProductListView.jsx';
import SearchPage from '../SearchPage.jsx';
import { VariantBottomSheet, ModernProductCard, ProductRow } from './FeedComponents.jsx';
import ShopCarousel from './ShopCarousel.jsx';
import { useToast, useConfirm } from '../ui/DialogProvider.jsx';

// 🌟 IMPORT OUR NEW BRAIN!
import useShopFeedData from './useShopFeedData'; // Adjust path based on where you saved it

export default function ShopFeed({
  user, onUserUpdate, onAddToCart, onRemoveFromCart, onViewCart, cart = [],
  selectedCategory, onClearCategory,
  selectedBrand, onBrandSelect, onClearBrand,
  isSearchOpen, onOpenSearch, onCloseSearch
}) {
  const toast = useToast();
  const confirmDialog = useConfirm();

  // 🌟 CALL THE BRAIN - It gives us all the arrays perfectly formatted!
  const { 
    loading, items, shopInfo, nearbyShops, 
    shopDeals, shopBestSellers, under99, timeBased, newArrivals, buyItAgain 
  } = useShopFeedData(user);
  
  // UI States (Modals & Views)
  const [selectedProductDetails, setSelectedProductDetails] = useState(null); 
  const [selectedVariantProduct, setSelectedVariantProduct] = useState(null);
  const [viewAll, setViewAll] = useState(null); 

  const BASE_URL = (import.meta.env.VITE_API_BASE || "https://darkslategrey-snail-415133.hostingersite.com");

  const handleSwitchShop = async (newShop) => {
    const ok = await confirmDialog({
      title: `Switch to ${newShop.name}?`,
      message: 'This will clear your current cart.',
      confirmText: 'Switch shop',
      danger: true,
    });
    if (!ok) return;
    try {
      const res = await fetch(`${BASE_URL}/users/${user._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ primaryShop: newShop._id }) });
      if(res.ok) {
        const updated = await res.json();
        // onUserUpdate is always passed from App.jsx; writing to localStorage
        // alone would leave React state out of sync with the persisted user,
        // so we just no-op rather than silently desyncing.
        if (onUserUpdate) onUserUpdate(updated, { clearCart: true });
        toast(`Switched to ${newShop.name}!`);
      }
    } catch (err) { toast("Failed to switch shop.", 'error'); }
  };

  const handleQuickAdd = (item) => {
    if (item.variants && item.variants.length > 1) setSelectedVariantProduct(item);
    else onAddToCart(item);
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Loading fresh products...</div>;

  let displayItems = items;
  let listTitle = "";
  
  if (viewAll) { displayItems = viewAll.items; listTitle = viewAll.title; } 
  else if (selectedCategory) { displayItems = items.filter(i => (i.category || "").toLowerCase().includes(selectedCategory.toLowerCase())); listTitle = selectedCategory; } 
  else if (selectedBrand) { displayItems = items.filter(i => i.brand === selectedBrand); listTitle = `Explore ${selectedBrand}`; }

  const shopClosed = shopInfo && !shopInfo.isOpen;
  const isListViewActive = viewAll || selectedCategory || selectedBrand;

  return (
    <div style={{ padding: '0', maxWidth: '1000px', margin: '0 auto', overflowX: 'hidden', backgroundColor: '#f3f4f6' }}>
      
      {isSearchOpen && (
        <SearchPage items={items} onClose={onCloseSearch} onOpenDetails={setSelectedProductDetails} onQuickAdd={handleQuickAdd} cart={cart} onRemoveFromCart={onRemoveFromCart} onViewCart={onViewCart} />
      )}

      {isListViewActive && !isSearchOpen && (
        <ProductListView
          title={listTitle} items={displayItems}
          onBack={() => { if (selectedCategory) onClearCategory(); if (selectedBrand && onClearBrand) onClearBrand(); setViewAll(null); }}
          shopClosed={shopClosed} onOpenDetails={setSelectedProductDetails} onQuickAdd={handleQuickAdd} cart={cart} onRemoveFromCart={onRemoveFromCart} onViewCart={onViewCart}
          onSearchClick={() => { if (selectedCategory) onClearCategory(); if (selectedBrand && onClearBrand) onClearBrand(); setViewAll(null); onOpenSearch(); }}
        />
      )}

      {!isSearchOpen && !isListViewActive && (
        <>
          <ProductRow title={timeBased.title} subtitle={timeBased.subtitle} items={timeBased.items} onViewAll={setViewAll} shopClosed={shopClosed} onOpenDetails={setSelectedProductDetails} onQuickAdd={handleQuickAdd} cart={cart} onRemoveFromCart={onRemoveFromCart} />
          <ProductRow title="Price Crash" subtitle="Extra Savings" items={shopDeals} onViewAll={setViewAll} shopClosed={shopClosed} onOpenDetails={setSelectedProductDetails} onQuickAdd={handleQuickAdd} cart={cart} onRemoveFromCart={onRemoveFromCart} />
          <ProductRow title="Top Picks for You" subtitle="Popular items" items={shopBestSellers} onViewAll={setViewAll} shopClosed={shopClosed} onOpenDetails={setSelectedProductDetails} onQuickAdd={handleQuickAdd} cart={cart} onRemoveFromCart={onRemoveFromCart} />
          <ProductRow title="The Under ₹99 Store" subtitle="Budget friendly grabs" items={under99} onViewAll={setViewAll} shopClosed={shopClosed} onOpenDetails={setSelectedProductDetails} onQuickAdd={handleQuickAdd} cart={cart} onRemoveFromCart={onRemoveFromCart} />
          <ProductRow title="Buy It Again" subtitle="Your favorites" items={buyItAgain} onViewAll={setViewAll} shopClosed={shopClosed} onOpenDetails={setSelectedProductDetails} onQuickAdd={handleQuickAdd} cart={cart} onRemoveFromCart={onRemoveFromCart} />
          <ProductRow title="Freshly Restocked" subtitle="Back on shelves" items={newArrivals} onViewAll={setViewAll} shopClosed={shopClosed} onOpenDetails={setSelectedProductDetails} onQuickAdd={handleQuickAdd} cart={cart} onRemoveFromCart={onRemoveFromCart} />

          <ShopCarousel shops={nearbyShops} onSwitchShop={handleSwitchShop} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '24px 24px 40px', color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            <span style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, #e2e8f0)' }} />
            <span>You're all caught up</span>
            <span style={{ flex: 1, height: '1px', background: 'linear-gradient(to left, transparent, #e2e8f0)' }} />
          </div>
        </>
      )}

      <VariantBottomSheet product={selectedVariantProduct} onClose={() => setSelectedVariantProduct(null)} onAddToCart={onAddToCart} />
      <ProductModal product={selectedProductDetails} isOpen={selectedProductDetails !== null} onClose={() => setSelectedProductDetails(null)} onAddToCart={onAddToCart} onRemoveFromCart={onRemoveFromCart} onViewCart={onViewCart} cart={cart} allItems={items} onViewBrand={(brand) => { if (onClearCategory) onClearCategory(); setViewAll(null); if (onBrandSelect) onBrandSelect(brand); }} />
    </div>
  );
}

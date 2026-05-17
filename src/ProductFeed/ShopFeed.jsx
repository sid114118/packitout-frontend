import React, { useState } from 'react';
import ProductModal from './ProductModal.jsx';
import ProductListView from './ProductListView.jsx';
import SearchPage from '../SearchPage.jsx';
import { VariantBottomSheet, ModernProductCard, ProductRow } from './FeedComponents.jsx';
import ShopCarousel from './ShopCarousel.jsx';
import { useToast, useConfirm } from '../ui/DialogProvider.jsx';
import HomeFooter from '../components/HomeFooter.jsx';
import { useRankingConfig } from '../ui/RankingProvider.jsx';
import { applyBrandPriority } from '../utils/rankingSort.js';

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
  const { config: rankingConfig } = useRankingConfig();

  // 🌟 CALL THE BRAIN - It gives us all the arrays perfectly formatted!
  const {
    loading, items, shopInfo, nearbyShops,
    shopDeals, shopBestSellers, under99, timeBased, newArrivals, buyItAgain
  } = useShopFeedData(user);

  // Apply admin brand-priority ranking to every home-row in a single pass.
  // useMemo dependencies include rankingConfig so changes from the admin
  // panel reflow the rows immediately (after RankingProvider refresh).
  const rankedTimeBased = React.useMemo(
    () => ({ ...timeBased, items: applyBrandPriority(timeBased.items, rankingConfig) }),
    [timeBased, rankingConfig]
  );
  const rankedShopDeals = React.useMemo(() => applyBrandPriority(shopDeals, rankingConfig), [shopDeals, rankingConfig]);
  const rankedShopBestSellers = React.useMemo(() => applyBrandPriority(shopBestSellers, rankingConfig), [shopBestSellers, rankingConfig]);
  const rankedUnder99 = React.useMemo(() => applyBrandPriority(under99, rankingConfig), [under99, rankingConfig]);
  const rankedNewArrivals = React.useMemo(() => applyBrandPriority(newArrivals, rankingConfig), [newArrivals, rankingConfig]);
  const rankedBuyItAgain = React.useMemo(() => applyBrandPriority(buyItAgain, rankingConfig), [buyItAgain, rankingConfig]);
  
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
          <ProductRow title="Freshly Restocked" subtitle="Back on shelves" items={rankedNewArrivals} onViewAll={setViewAll} shopClosed={shopClosed} onOpenDetails={setSelectedProductDetails} onQuickAdd={handleQuickAdd} cart={cart} onRemoveFromCart={onRemoveFromCart} />
          <ProductRow title={rankedTimeBased.title} subtitle={rankedTimeBased.subtitle} items={rankedTimeBased.items} onViewAll={setViewAll} shopClosed={shopClosed} onOpenDetails={setSelectedProductDetails} onQuickAdd={handleQuickAdd} cart={cart} onRemoveFromCart={onRemoveFromCart} />
          <ProductRow title="Price Crash" subtitle="Extra Savings" items={rankedShopDeals} onViewAll={setViewAll} shopClosed={shopClosed} onOpenDetails={setSelectedProductDetails} onQuickAdd={handleQuickAdd} cart={cart} onRemoveFromCart={onRemoveFromCart} />
          <ProductRow title="Top Picks for You" subtitle="Popular items" items={rankedShopBestSellers} onViewAll={setViewAll} shopClosed={shopClosed} onOpenDetails={setSelectedProductDetails} onQuickAdd={handleQuickAdd} cart={cart} onRemoveFromCart={onRemoveFromCart} />
          <ProductRow title="The Under ₹99 Store" subtitle="Budget friendly grabs" items={rankedUnder99} onViewAll={setViewAll} shopClosed={shopClosed} onOpenDetails={setSelectedProductDetails} onQuickAdd={handleQuickAdd} cart={cart} onRemoveFromCart={onRemoveFromCart} />
          <ProductRow title="Buy It Again" subtitle="Your favorites" items={rankedBuyItAgain} onViewAll={setViewAll} shopClosed={shopClosed} onOpenDetails={setSelectedProductDetails} onQuickAdd={handleQuickAdd} cart={cart} onRemoveFromCart={onRemoveFromCart} />

          <ShopCarousel shops={nearbyShops} onSwitchShop={handleSwitchShop} />
          <HomeFooter endMessage="You're all caught up" />
        </>
      )}

      <VariantBottomSheet product={selectedVariantProduct} onClose={() => setSelectedVariantProduct(null)} onAddToCart={onAddToCart} />
      <ProductModal product={selectedProductDetails} isOpen={selectedProductDetails !== null} onClose={() => setSelectedProductDetails(null)} onAddToCart={onAddToCart} onRemoveFromCart={onRemoveFromCart} onViewCart={onViewCart} cart={cart} allItems={items} onViewBrand={(brand) => { if (onClearCategory) onClearCategory(); setViewAll(null); if (onBrandSelect) onBrandSelect(brand); }} />
    </div>
  );
}

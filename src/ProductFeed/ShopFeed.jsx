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
import { userFetch } from '../utils/api.js';

// 🌟 IMPORT OUR NEW BRAIN!
import useShopFeedData from './useShopFeedData'; 
// 🌟 IMPORT THE SKELETON
import ProductSkeletonGrid from './ProductSkeletonGrid.jsx'; 

export default function ShopFeed({
  user, onUserUpdate, onAddToCart, onRemoveFromCart, onViewCart, cart = [],
  selectedCategory, onClearCategory,
  selectedBrand, onBrandSelect, onClearBrand,
  isSearchOpen, onOpenSearch, onCloseSearch
}) {
  const toast = useToast();
  const confirmDialog = useConfirm();
  const { config: rankingConfig } = useRankingConfig();

  // 🌟 CALL THE BRAIN
  const {
    loading, items, shopInfo, nearbyShops,
    shopDeals, shopBestSellers, under99, timeBased, newArrivals, buyItAgain
  } = useShopFeedData(user);

  const rankedTimeBased = React.useMemo(
    () => ({ ...timeBased, items: applyBrandPriority(timeBased.items, rankingConfig) }),
    [timeBased, rankingConfig]
  );
  const rankedShopDeals = React.useMemo(() => applyBrandPriority(shopDeals, rankingConfig), [shopDeals, rankingConfig]);
  const rankedShopBestSellers = React.useMemo(() => applyBrandPriority(shopBestSellers, rankingConfig), [shopBestSellers, rankingConfig]);
  const rankedUnder99 = React.useMemo(() => applyBrandPriority(under99, rankingConfig), [under99, rankingConfig]);
  const rankedNewArrivals = React.useMemo(() => applyBrandPriority(newArrivals, rankingConfig), [newArrivals, rankingConfig]);
  const rankedBuyItAgain = React.useMemo(() => applyBrandPriority(buyItAgain, rankingConfig), [buyItAgain, rankingConfig]);
  
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
      const res = await userFetch(user, `/users/${user._id}`, { method: 'PATCH', body: JSON.stringify({ primaryShop: newShop._id }) });
      if(res.ok) {
        const updated = await res.json();
        if (onUserUpdate) onUserUpdate(updated, { clearCart: true });
        toast(`Switched to ${newShop.name}!`);
      }
    } catch (err) { toast("Failed to switch shop.", 'error'); }
  };

  const handleQuickAdd = (item) => {
    if (item.variants && item.variants.length > 1) setSelectedVariantProduct(item);
    else onAddToCart(item);
  };

  // 🚀 THE MAGIC SKELETON UI INSTEAD OF TEXT
  if (loading) {
    return (
      <div style={{ padding: '15px 0', maxWidth: '1000px', margin: '0 auto', overflowX: 'hidden', backgroundColor: '#f3f4f6', minHeight: '100vh' }}>
        {/* Fake Row Header Skeleton */}
        <div style={{ padding: '0 15px', marginBottom: '15px' }}>
          <div className="skeleton-shimmer" style={{ width: '45%', height: '22px', borderRadius: '8px', backgroundColor: '#e2e8f0', marginBottom: '6px' }}></div>
          <div className="skeleton-shimmer" style={{ width: '25%', height: '14px', borderRadius: '6px', backgroundColor: '#e2e8f0' }}></div>
        </div>
        
        {/* The Grid itself */}
        <ProductSkeletonGrid count={8} />
      </div>
    );
  }

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
          <ProductRow title="Freshly Restocked" subtitle="Back on shelves" items={rankedNewArrivals} onViewAll={setViewAll} shopClosed={shopClosed} onOpenDetails={setSelectedProductDetails} onQuickAdd={handleQuickAdd} cart={cart} onRemoveFromCart={onRemoveFromCart} hideBrandPrefix />
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

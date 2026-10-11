import React, { useState } from 'react';
import ProductModal from './ProductModal.jsx';
import ProductListView from './ProductListView.jsx';
import SearchPage from '../SearchPage.jsx';
import { VariantBottomSheet, ModernProductCard, ProductRow, ComboDetailModal } from './FeedComponents.jsx';
import Categories from '../Categories.jsx';
import ShopCarousel from './ShopCarousel.jsx';
import { useToast, useConfirm } from '../ui/DialogProvider.jsx';
import HomeFooter from '../components/HomeFooter.jsx';
import { useRankingConfig } from '../ui/RankingProvider.jsx';
import { applyBrandPriority } from '../utils/rankingSort.js';
import { userFetch } from '../utils/api.js';
import { useBaskets } from '../utils/useBaskets.js';
import { cdnImage } from '../utils/cloudinaryUrl.js';
import { triggerShopWelcome } from '../utils/shopWelcome.js';

// 🌟 IMPORT OUR NEW BRAIN!
import useShopFeedData from './useShopFeedData'; 
// 🌟 IMPORT THE SKELETON
import ProductSkeletonGrid from './ProductSkeletonGrid.jsx'; 

export default function ShopFeed({
  user, onUserUpdate, onAddToCart, onRemoveFromCart, onViewCart, cart = [],
  selectedCategory, onClearCategory, onCategorySelect,
  selectedBrand, onBrandSelect, onClearBrand,
  isSearchOpen, onOpenSearch, onCloseSearch,
  autoStartVoiceSearch = false
}) {
  const toast = useToast();
  const confirmDialog = useConfirm();
  const { config: rankingConfig } = useRankingConfig();

  // 🌟 CALL THE BRAIN
  const {
    loading, items, shopInfo, nearbyShops,
    shopRecommendations, shopCombos, campaigns, shopDeals, shopBestSellers, under99, timeBased, newArrivals, buyItAgain
  } = useShopFeedData(user);

  // Get favorites basket
  const { baskets } = useBaskets();
  const favBasket = baskets.find(b => b.id === 'favourites');
  const favItems = React.useMemo(() => {
    if (!favBasket || !favBasket.items.length || items.length === 0) return [];
    return favBasket.items.map(favItem => items.find(i => i._id === favItem._id)).filter(Boolean);
  }, [favBasket, items]);

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
  const [selectedComboDetail, setSelectedComboDetail] = useState(null);
  const [viewAll, setViewAll] = useState(null); 
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  const BASE_URL = (import.meta.env.VITE_API_BASE || "https://darkslategrey-snail-415133.hostingersite.com");

  const handleSwitchShop = async (newShop) => {
    const ok = await confirmDialog({
      title: `Switch to ${newShop.name}?`,
      message: 'This will clear your current cart.',
      confirmText: 'Switch shop',
      danger: true,
    });
    if (!ok) return;

    // Handle guest shop switching instantly without hitting DB
    if (!user?._id) {
      localStorage.setItem("packitout_guest_shop_id", newShop._id);
      localStorage.setItem("packitout_guest_shop_name", newShop.name);
      if (newShop.pincode) localStorage.setItem("packitout_guest_pincode", newShop.pincode);
      window.dispatchEvent(new CustomEvent('PACKITOUT_SHOP_CHANGED', {
        detail: { shopId: newShop._id, pincode: newShop.pincode, shopName: newShop.name }
      }));
      triggerShopWelcome({
        name: newShop.name,
        pincode: newShop.pincode,
        isOpen: newShop.isOpen,
        shopImage: newShop.shopImage
      });
      return;
    }

    try {
      const res = await userFetch(user, `/users/${user._id}`, { method: 'PATCH', body: JSON.stringify({ primaryShop: newShop._id }) });
      if(res.ok) {
        const updated = await res.json();
        if (onUserUpdate) onUserUpdate(updated, { clearCart: true });
        triggerShopWelcome({
          name: newShop.name,
          pincode: newShop.pincode,
          isOpen: newShop.isOpen,
          shopImage: newShop.shopImage
        });
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
  else if (selectedCampaign) { 
    displayItems = items.filter(i => i.inStock && selectedCampaign.keywords.some(kw => (i.name||"").toLowerCase().includes(kw.toLowerCase()) || (i.category||"").toLowerCase().includes(kw.toLowerCase()))); 
    listTitle = selectedCampaign.title; 
  }

  const shopClosed = shopInfo && !shopInfo.isOpen;
  const isListViewActive = viewAll || selectedCategory || selectedBrand || selectedCampaign;

  return (
    <div style={{ padding: '0', maxWidth: '1000px', margin: '0 auto', overflowX: 'hidden', backgroundColor: '#f3f4f6' }}>
      
      {isSearchOpen && (
        <SearchPage
          items={items}
          onClose={onCloseSearch}
          onOpenDetails={setSelectedProductDetails}
          onQuickAdd={handleQuickAdd}
          cart={cart}
          onRemoveFromCart={onRemoveFromCart}
          onViewCart={onViewCart}
          autoStartVoice={autoStartVoiceSearch}
        />
      )}

      {isListViewActive && !isSearchOpen && (
        <ProductListView
          title={listTitle} items={displayItems}
          onBack={() => { if (selectedCategory) onClearCategory(); if (selectedBrand && onClearBrand) onClearBrand(); setViewAll(null); setSelectedCampaign(null); }}
          shopClosed={shopClosed} onOpenDetails={setSelectedProductDetails} onQuickAdd={handleQuickAdd} cart={cart} onRemoveFromCart={onRemoveFromCart} onViewCart={onViewCart}
          onSearchClick={() => { if (selectedCategory) onClearCategory(); if (selectedBrand && onClearBrand) onClearBrand(); setViewAll(null); setSelectedCampaign(null); onOpenSearch(); }}
        />
      )}

      {!isSearchOpen && !isListViewActive && (
        <>
          {/* 🛒 CATEGORIES (With Diwali Special & Combos between Top Picks and Daily Fresh & Staples) */}
          <Categories onCategorySelect={onCategorySelect} onAddToCart={onAddToCart}>
            {/* 🌍 GLOBAL CAMPAIGNS */}
            {campaigns?.length > 0 && (
              <div className="hide-scroll" style={{ display: 'flex', gap: '15px', padding: '0 0 16px', overflowX: 'auto', marginInline: '-15px', paddingInline: '15px' }}>
                <style>{`.hide-scroll::-webkit-scrollbar { display: none; }`}</style>
                {campaigns.map(camp => (
                  <div key={camp._id} onClick={() => setSelectedCampaign(camp)} style={{ minWidth: '280px', flex: 1, padding: '20px', borderRadius: '16px', background: camp.bannerColor, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                    <span style={{ fontSize: '2.5rem', background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '50%' }}>{camp.emoji}</span>
                    <div>
                      <h3 style={{ margin: '0 0 5px 0', fontSize: '1.2rem', fontWeight: '800' }}>{camp.title}</h3>
                      <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.9 }}>{camp.subtitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 🎁 SHOP COMBOS */}
            {shopCombos?.length > 0 && (
              <div style={{ padding: '0 0 4px', marginInline: '-15px', paddingInline: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h3 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.15rem', fontWeight: '800' }}>
                    📦 Special Combo Packs
                    <span style={{ fontSize: '0.7rem', background: '#fef08a', color: '#854d0e', padding: '2px 8px', borderRadius: '10px', fontWeight: '800' }}>HOT DEALS</span>
                  </h3>
                </div>

                <div className="hide-scroll" style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '10px' }}>
                  {shopCombos.map(combo => {
                    const rawPids = Array.isArray(combo.productIds) ? combo.productIds : [];
                    const comboItems = rawPids.map(p => {
                      const pidStr = (typeof p === 'object' && p?._id) ? String(p._id) : String(p);
                      const matched = items.find(i => String(i._id) === pidStr || i.variants?.some(v => String(v._id) === pidStr));
                      if (matched) return matched;
                      if (typeof p === 'object' && p?._id) return p;
                      return null;
                    }).filter(Boolean);

                    const regularTotal = comboItems.reduce((sum, item) => sum + Number(item.sellingPrice || item.mrp || 0), 0);
                    const effectivePrice = combo.comboPrice > 0 ? combo.comboPrice : regularTotal;
                    const savings = (combo.comboPrice > 0 && regularTotal > combo.comboPrice) ? (regularTotal - combo.comboPrice) : 0;

                    return (
                      <div 
                        key={combo._id} 
                        onClick={() => setSelectedComboDetail(combo)}
                        style={{ 
                          minWidth: '250px', 
                          maxWidth: '280px', 
                          flexShrink: 0, 
                          border: '1.5px solid #fde68a', 
                          borderRadius: '18px', 
                          padding: '16px', 
                          backgroundColor: '#fff', 
                          display: 'flex', 
                          flexDirection: 'column', 
                          justifyContent: 'space-between', 
                          boxShadow: '0 4px 15px rgba(245, 158, 11, 0.08)',
                          cursor: 'pointer',
                          transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <h4 style={{ margin: 0, fontSize: '1rem', color: '#1e293b', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '1.3rem' }}>{combo.emoji || '🎁'}</span>
                              <span>{combo.name}</span>
                            </h4>
                            {savings > 0 && (
                              <span style={{ backgroundColor: '#10b981', color: '#fff', fontSize: '0.68rem', fontWeight: '800', padding: '2px 6px', borderRadius: '6px' }}>
                                SAVE ₹{savings}
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '8px 0 6px' }} className="hide-scroll">
                            {comboItems.map((ci, idx) => (
                              <div 
                                key={idx} 
                                title={ci.name} 
                                style={{ 
                                  width: '44px', 
                                  height: '44px', 
                                  borderRadius: '10px', 
                                  border: '1px solid #e2e8f0', 
                                  overflow: 'hidden', 
                                  display: 'flex', 
                                  justifyContent: 'center', 
                                  alignItems: 'center', 
                                  backgroundColor: '#f8fafc', 
                                  flexShrink: 0 
                                }}
                              >
                                {ci.image ? (
                                  <img src={cdnImage(ci.image, 100)} alt={ci.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                ) : (
                                  <span style={{ fontSize: '1.2rem' }}>{ci.emoji || '📦'}</span>
                                )}
                              </div>
                            ))}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#d97706', fontWeight: '700', marginBottom: '10px' }}>
                            <span>Tap to see all items</span>
                            <span>›</span>
                          </div>
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '10px' }}>
                            <span style={{ fontWeight: '900', fontSize: '1.25rem', color: '#0f172a' }}>
                              ₹{effectivePrice}
                            </span>
                            {savings > 0 && (
                              <span style={{ fontSize: '0.8rem', color: '#94a3b8', textDecoration: 'line-through', fontWeight: '600' }}>
                                ₹{regularTotal}
                              </span>
                            )}
                            <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: 'auto' }}>
                              {comboItems.length} items
                            </span>
                          </div>

                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              comboItems.forEach(item => {
                                const toAdd = (item.variants && item.variants.length > 0) ? item.variants[0] : item;
                                onAddToCart(toAdd);
                              });
                              toast('Combo box added to cart! 🎁');
                            }}
                            style={{ 
                              width: '100%', 
                              padding: '10px', 
                              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', 
                              color: '#fff', 
                              border: 'none', 
                              borderRadius: '10px', 
                              fontWeight: '800', 
                              fontSize: '0.88rem', 
                              cursor: 'pointer', 
                              boxShadow: '0 4px 10px rgba(245, 158, 11, 0.25)' 
                            }}
                          >
                            Add Box To Cart 🛒
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Categories>

          {shopRecommendations?.length > 0 && (
            <ProductRow title="Shopkeeper's Picks" subtitle="🔥 Featured for you" items={shopRecommendations} onViewAll={setViewAll} shopClosed={shopClosed} onOpenDetails={setSelectedProductDetails} onQuickAdd={handleQuickAdd} cart={cart} onRemoveFromCart={onRemoveFromCart} />
          )}
          {favItems?.length > 0 && (
            <ProductRow title="Your Favorites ❤️" subtitle="Handpicked by you" items={favItems} onViewAll={setViewAll} shopClosed={shopClosed} onOpenDetails={setSelectedProductDetails} onQuickAdd={handleQuickAdd} cart={cart} onRemoveFromCart={onRemoveFromCart} />
          )}
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

      <VariantBottomSheet product={selectedVariantProduct} onClose={() => setSelectedVariantProduct(null)} onAddToCart={onAddToCart} onRemoveFromCart={onRemoveFromCart} cart={cart} />
      <ProductModal product={selectedProductDetails} isOpen={selectedProductDetails !== null} onClose={() => setSelectedProductDetails(null)} onAddToCart={onAddToCart} onRemoveFromCart={onRemoveFromCart} onViewCart={onViewCart} cart={cart} allItems={items} onViewBrand={(brand) => { if (onClearCategory) onClearCategory(); setViewAll(null); if (onBrandSelect) onBrandSelect(brand); }} />
      <ComboDetailModal combo={selectedComboDetail} items={items} onClose={() => setSelectedComboDetail(null)} onAddToCart={(item) => { onAddToCart(item); toast('Combo box added to cart! 🎁'); }} />
    </div>
  );
}

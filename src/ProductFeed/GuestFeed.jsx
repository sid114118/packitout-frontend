import React, { useState, useEffect } from 'react';
import ProductModal from './ProductModal.jsx';

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
        
        // 🛡️ BULLETPROOF GROUPING LOGIC (Same as ShopFeed)
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

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading fresh products...</div>;

  // 💎 PREMIUM MODERN PRODUCT CARD
  const ModernProductCard = ({ item, isCarousel }) => {
    return (
      <div style={{ 
        minWidth: isCarousel ? '140px' : 'auto', 
        maxWidth: isCarousel ? '150px' : 'auto', 
        flexShrink: 0, 
        border: '1px solid #f3f4f6', 
        borderRadius: '8px', 
        padding: '8px', 
        backgroundColor: '#fff', 
        position: 'relative',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
        scrollSnapAlign: 'start'
      }}>
        
        <div 
          onClick={() => setSelectedProductDetails(item)}
          style={{ position: 'relative', height: '110px', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: '6px', marginBottom: '16px', cursor: 'pointer' }}
        >
          {item.isDiscounted && (
            <span style={{ position: 'absolute', top: 0, left: '-8px', backgroundColor: '#0f9d58', color: '#fff', fontSize: '0.7rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: '0 8px 8px 0', zIndex: 1 }}>
              ↓{item.discountPercent}%
            </span>
          )}

          {item.image ? (
            <img src={item.image} alt={item.name} style={{ maxHeight: '90%', maxWidth: '90%', objectFit: 'contain' }} />
          ) : (
            <span style={{fontSize: '40px'}}>{item.emoji}</span>
          )}

          <div style={{ position: 'absolute', bottom: 0, left: 0, backgroundColor: '#fff', border: '1px solid #e5e7eb', fontSize: '0.65rem', padding: '2px 4px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 'bold' }}>
            4.2 <span style={{ color: '#0f9d58' }}>★</span>
          </div>

          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              if (item.variants && item.variants.length > 1) {
                setSelectedVariantProduct(item);
              } else {
                onAddToCart({ ...item, mrp: item.sellingPrice }); 
              }
            }} 
            style={{ position: 'absolute', bottom: '-12px', right: '5px', backgroundColor: '#fff', color: '#0f9d58', border: '1px solid #0f9d58', borderRadius: '6px', padding: '4px 14px', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
          >
            ADD
          </button>
        </div>

        <div>
          <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 4px 0', minHeight: '14px' }}>
            {item.qnty || "1 pc"} 
            {item.variants && item.variants.length > 1 && <span style={{color: '#d97706', fontWeight: 'bold'}}> ({item.variants.length} sizes)</span>}
          </p>
          
          <h4 style={{ fontSize: '0.85rem', margin: '0 0 8px 0', color: '#111827', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', height: '2.4em', lineHeight: '1.2em' }}>
            {item.brand ? `${item.brand} ` : ''}{item.name}
          </h4>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ backgroundColor: '#fef08a', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.85rem', color: '#000' }}>
              ₹{item.sellingPrice}
            </span>
            {item.isDiscounted && (
              <span style={{ fontSize: '0.75rem', color: '#9ca3af', textDecoration: 'line-through' }}>
                ₹{item.mrp}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  // 💎 PREMIUM PRODUCT ROW
  const ProductRow = ({ title, subtitle, items }) => {
    if (!items || items.length === 0) return null;
    return (
      <div style={{ marginBottom: '24px', backgroundColor: '#fff', padding: '15px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', padding: '0 15px' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', margin: 0, color: '#111827', fontWeight: 'bold' }}>{title}</h2>
            {subtitle && <p style={{ fontSize: '0.75rem', margin: '2px 0 0 0', color: '#6b7280' }}>{subtitle}</p>}
          </div>
          <button 
            onClick={() => setViewAll({ title, items })}
            style={{ backgroundColor: '#111827', color: '#fff', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1rem', cursor: 'pointer' }}
          >
            ➔
          </button>
        </div>
        <div className="hide-scroll" style={{ display: 'flex', overflowX: 'auto', gap: '12px', padding: '0 15px 10px 15px', scrollSnapType: 'x mandatory' }}>
          {items.map(item => <ModernProductCard key={item._id} item={item} isCarousel={true} />)}
        </div>
      </div>
    );
  };

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
              {displayItems.map(item => <ModernProductCard key={item._id} item={item} isCarousel={false} />)}
            </div>
          )}
        </div>
      ) : (
        <>
          <ProductRow title="🚀 Trending on PackItOut" subtitle="What everyone is ordering" items={trendingPlatform} />
          <ProductRow title={timeBased.title} subtitle={timeBased.subtitle} items={timeBased.items} />
          <ProductRow title="🔥 Today's Mega Steals" subtitle="Unbeatable prices" items={shopDeals} />
          <ProductRow title="🛍️ Recommended For You" subtitle="Top picks for guests" items={buyItAgain} />
          <ProductRow title="💰 The Under ₹99 Store" subtitle="Budget friendly grabs" items={under99} />
          <ProductRow title="🆕 Freshly Restocked" subtitle="Back on the shelves" items={newArrivals} />
          <ProductRow title="👑 Top Selling Today" subtitle="Customer favorites" items={shopBestSellers} />
        </>
      )}

      {/* 📋 THE QUICK VARIANT SELECTION SHEET */}
      {selectedVariantProduct && (
        <>
          <div 
            onClick={() => setSelectedVariantProduct(null)} 
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000, backdropFilter: 'blur(2px)' }} 
          />
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1001, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            
            <button 
              onClick={() => setSelectedVariantProduct(null)} 
              style={{ marginBottom: '15px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '50%', width: '40px', height: '40px', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}
            >
              ✕
            </button>
            
            <div style={{ backgroundColor: '#f3f4f6', width: '100%', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '20px', paddingBottom: '30px', maxHeight: '75vh', overflowY: 'auto', animation: 'slideUp 0.3s ease-out' }}>
              <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
              
              <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', color: '#111827', fontWeight: 'bold' }}>
                {selectedVariantProduct.name}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {selectedVariantProduct.variants.map((variant, idx) => {
                  const vPrice = variant.sellingPrice || variant.mrp;
                  const vDiscounted = vPrice < variant.mrp;
                  const vDiscountPercent = vDiscounted ? Math.round(((variant.mrp - vPrice) / variant.mrp) * 100) : 0;

                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: '12px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ position: 'relative', width: '50px', height: '50px', backgroundColor: '#f9fafb', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          {vDiscounted && (
                            <span style={{ position: 'absolute', top: '-5px', left: '-5px', backgroundColor: '#2563eb', color: '#fff', fontSize: '0.6rem', fontWeight: 'bold', padding: '2px 4px', borderRadius: '4px', zIndex: 1 }}>
                              {vDiscountPercent}% OFF
                            </span>
                          )}
                          {variant.image ? (
                            <img src={variant.image} alt="" style={{ maxWidth: '40px', maxHeight: '40px', objectFit: 'contain' }} />
                          ) : (
                            <span style={{ fontSize: '24px' }}>{variant.emoji}</span>
                          )}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.85rem', color: '#4b5563', fontWeight: '500' }}>{variant.qnty}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#111827' }}>₹{vPrice}</span>
                            {vDiscounted && <span style={{ fontSize: '0.75rem', color: '#9ca3af', textDecoration: 'line-through' }}>₹{variant.mrp}</span>}
                          </div>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => {
                          onAddToCart({ ...variant, mrp: vPrice });
                          setSelectedVariantProduct(null); 
                        }} 
                        style={{ backgroundColor: '#fff', color: '#0f9d58', border: '1px solid #0f9d58', borderRadius: '6px', padding: '6px 16px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        ADD
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* 📝 THE FULL DETAILS MODAL */}
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

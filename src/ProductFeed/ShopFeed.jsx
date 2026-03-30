import React, { useState, useEffect } from 'react';
import ProductModal from './ProductModal.jsx';

export default function ShopFeed({ user, onAddToCart, cart = [], selectedCategory, onClearCategory, searchQuery }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shopInfo, setShopInfo] = useState(null);
  
  const [nearbyShops, setNearbyShops] = useState([]);
  const [selectedProductDetails, setSelectedProductDetails] = useState(null); 
  
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

        // 👇 UPDATED LOGIC: Groups products with the same itemGroupId into a single card
        const groupedMap = new Map();
        const availableItems = [];

        shopData.inventory?.filter(item => item.product).forEach(item => {
          const sellingPrice = item.sellingPrice !== undefined && item.sellingPrice !== null ? item.sellingPrice : item.product.mrp;
          const formattedItem = {
            ...item.product,
            sellingPrice: sellingPrice,
            isDiscounted: sellingPrice < item.product.mrp,
            discountPercent: sellingPrice < item.product.mrp ? Math.round(((item.product.mrp - sellingPrice) / item.product.mrp) * 100) : 0,
            inStock: item.inStock
          };

          // If the product has a group ID, bundle it up!
          if (formattedItem.itemGroupId && formattedItem.itemGroupId.trim() !== "") {
            if (!groupedMap.has(formattedItem.itemGroupId)) {
              formattedItem.variants = [formattedItem]; // Create an array to hold all sizes
              groupedMap.set(formattedItem.itemGroupId, formattedItem);
              availableItems.push(formattedItem);
            } else {
              // Add this size to the existing main card
              groupedMap.get(formattedItem.itemGroupId).variants.push(formattedItem);
            }
          } else {
            // Normal product with no group ID
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
        let timeTitle = "";
        let timeSubtitle = "";
        let keywords = [];

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

        const matchedItems = availableItems.filter(i => {
          const cat = (i.category || "").toLowerCase();
          const name = (i.name || "").toLowerCase();
          return i.inStock && keywords.some(kw => cat.includes(kw) || name.includes(kw));
        });

        setTimeBased({ title: timeTitle, subtitle: timeSubtitle, items: matchedItems.length > 0 ? matchedItems.slice(0, 12) : availableItems.filter(i => i.inStock).slice(0, 12) });

      } catch (err) { console.log(err); }
      setLoading(false);
    };

    fetchShopProducts();
  }, [user]);

  const handleSwitchShop = async (newShop) => {
    const confirmSwitch = window.confirm(`Switch to ${newShop.name}? This will clear your current cart.`);
    if (!confirmSwitch) return;

    try {
      const res = await fetch(`${BASE_URL}/users/${user._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ primaryShop: newShop._id })
      });
      const updatedUser = await res.json();
      localStorage.setItem("packitout_user", JSON.stringify(updatedUser));
      window.location.reload();
    } catch (err) { alert("Failed to switch shop. Please try again."); }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Loading fresh products...</div>;

  const ModernProductCard = ({ item, isCarousel }) => {
    const isOutOfStock = !item.inStock;
    const shopClosed = shopInfo && !shopInfo.isOpen;

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
        opacity: isOutOfStock ? 0.6 : 1, 
        filter: isOutOfStock ? 'grayscale(80%)' : 'none',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
        scrollSnapAlign: 'start'
      }}>
        
        <div 
          onClick={() => setSelectedProductDetails(item)}
          style={{ position: 'relative', height: '110px', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: '6px', marginBottom: '16px', cursor: 'pointer' }}
        >
          {item.isDiscounted && !isOutOfStock && (
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

          {/* 👇 UPDATED: Changed the '+' to a clean 'ADD' pill button */}
          {!isOutOfStock && !shopClosed && (
            <button 
              onClick={(e) => { e.stopPropagation(); onAddToCart({ ...item, mrp: item.sellingPrice }); }} 
              style={{ position: 'absolute', bottom: '-12px', right: '5px', backgroundColor: '#fff', color: '#0f9d58', border: '1px solid #0f9d58', borderRadius: '6px', padding: '4px 14px', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
            >
              ADD
            </button>
          )}
        </div>

        <div>
          <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 4px 0', minHeight: '14px' }}>
            {item.qnty || "1 pc"} 
            {/* Show a tiny indicator if there are multiple sizes hiding inside */}
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

          {isOutOfStock && <div style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 'bold', marginTop: '8px' }}>OUT OF STOCK</div>}
          {shopClosed && !isOutOfStock && <div style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 'bold', marginTop: '8px' }}>CLOSED</div>}
        </div>
      </div>
    );
  };

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
          <ProductRow title={timeBased.title} subtitle={timeBased.subtitle} items={timeBased.items} />
          <ProductRow title="Price Crash" subtitle="Extra Savings" items={shopDeals} />
          <ProductRow title="Top Picks for You" subtitle="Based on what is popular around you" items={shopBestSellers} />
          <ProductRow title="The Under ₹99 Store" subtitle="Budget friendly grabs" items={under99} />
          <ProductRow title="Buy It Again" subtitle="Your recent favorites" items={buyItAgain} />
          <ProductRow title="Freshly Restocked" subtitle="Back on the shelves" items={newArrivals} />

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

      <ProductModal 
        product={selectedProductDetails} 
        isOpen={selectedProductDetails !== null} 
        onClose={() => setSelectedProductDetails(null)} 
        onAddToCart={(item) => {
          onAddToCart({ ...item, mrp: item.sellingPrice });
          setSelectedProductDetails(null); 
        }}
        cart={cart}
      />
    </div>
  );
                }

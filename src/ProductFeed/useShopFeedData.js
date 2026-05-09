import { useState, useEffect } from 'react';

const BASE_URL = "https://darkslategrey-snail-415133.hostingersite.com";

export default function useShopFeedData(user) {
  
  // ⚡ ZERO-FRAME CACHE: Read memory BEFORE React even draws the first pixel!
  const initialCache = (() => {
    if (!user || !user.primaryShop) return null;
    const shopId = typeof user.primaryShop === 'object' ? user.primaryShop._id : user.primaryShop;
    try {
      const cached = localStorage.getItem(`packitout_feed_cache_${shopId}`);
      return cached ? JSON.parse(cached) : null;
    } catch (e) { return null; }
  })();

  // 🚀 Start loading as FALSE if we have cache! This kills the "Loading fresh products" screen forever.
  const [loading, setLoading] = useState(initialCache ? false : true);
  
  // 🚀 Load all items instantly from memory on frame 1
  const [items, setItems] = useState(initialCache?.items || []);
  const [shopInfo, setShopInfo] = useState(initialCache?.shopInfo || null);
  const [nearbyShops, setNearbyShops] = useState(initialCache?.nearbyShops || []);
  const [shopDeals, setShopDeals] = useState(initialCache?.shopDeals || []);
  const [shopBestSellers, setShopBestSellers] = useState(initialCache?.shopBestSellers || []);
  const [under99, setUnder99] = useState(initialCache?.under99 || []);
  const [timeBased, setTimeBased] = useState(initialCache?.timeBased || { title: "", subtitle: "", items: [] });
  const [newArrivals, setNewArrivals] = useState(initialCache?.newArrivals || []);
  const [buyItAgain, setBuyItAgain] = useState(initialCache?.buyItAgain || []);

  useEffect(() => {
    if (!user || !user.primaryShop) {
      setLoading(false);
      return;
    }

    const shopId = typeof user.primaryShop === 'object' ? user.primaryShop._id : user.primaryShop;
    const cacheKey = `packitout_feed_cache_${shopId}`;
    let cancelled = false;

    const fetchJson = (url) => fetch(url).then(r => r.ok ? r.json() : null).catch(() => null);

    const fetchShopProducts = async () => {
      // Fire all three independent requests in parallel. The old code chained
      // them sequentially and the /orders call was a global table scan — now
      // /orders/user/:userId returns just the recent items list for one user.
      const [shopData, nearbyShopsData, userOrders] = await Promise.all([
        fetchJson(`${BASE_URL}/shops/${shopId}/menu/lean?t=${Date.now()}`),
        user.pincode ? fetchJson(`${BASE_URL}/shops/all/${user.pincode}`) : Promise.resolve([]),
        user._id ? fetchJson(`${BASE_URL}/orders/user/${user._id}`) : Promise.resolve([]),
      ]);

      if (cancelled) return;

      if (!shopData) {
        setLoading(false);
        return;
      }

      const newShopInfo = { name: shopData.name, isOpen: shopData.isOpen };
      setShopInfo(newShopInfo);

      const newNearbyShops = Array.isArray(nearbyShopsData)
        ? nearbyShopsData.filter(s => s._id !== shopId)
        : [];
      setNearbyShops(newNearbyShops);

      const groupedMap = new Map();
      const availableItems = [];

      shopData.inventory?.filter(item => item && item.product).forEach(item => {
        const mrp = Number(item.product.mrp || 0);
        const sellingPrice = (item.sellingPrice !== undefined && item.sellingPrice !== null) ? Number(item.sellingPrice) : mrp;
        const isDiscounted = mrp > 0 && sellingPrice < mrp;
        const discountPercent = (isDiscounted && mrp > 0) ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0;

        const formattedItem = { ...item.product, sellingPrice, mrp, inStock: item.inStock, isDiscounted, discountPercent };

        if (formattedItem.itemGroupId && formattedItem.itemGroupId.trim() !== "") {
          const groupId = String(formattedItem.itemGroupId).trim().toUpperCase();
          if (!groupedMap.has(groupId)) {
            formattedItem.variants = [{ ...formattedItem }];
            groupedMap.set(groupId, formattedItem);
            availableItems.push(formattedItem);
          } else {
            groupedMap.get(groupId).variants.push({ ...formattedItem });
          }
        } else {
          availableItems.push(formattedItem);
        }
      });

      setItems(availableItems);

      const newShopDeals = availableItems.filter(i => i.isDiscounted && i.inStock).sort((a, b) => b.discountPercent - a.discountPercent).slice(0, 12);
      const newBestSellers = availableItems.filter(i => i.inStock).slice(0, 12);
      const newUnder99 = availableItems.filter(i => i.sellingPrice > 0 && i.sellingPrice < 100 && i.inStock).slice(0, 12);
      const newArrivalsList = [...availableItems].reverse().filter(i => i.inStock).slice(0, 12);

      setShopDeals(newShopDeals);
      setShopBestSellers(newBestSellers);
      setUnder99(newUnder99);
      setNewArrivals(newArrivalsList);

      const pastBoughtIds = new Set();
      if (Array.isArray(userOrders)) {
        userOrders.forEach(order => {
          order.items?.forEach(orderedItem => {
            const pId = orderedItem.product?._id || orderedItem.product || orderedItem._id || orderedItem.productId;
            if (pId) pastBoughtIds.add(pId.toString());
          });
        });
      }

      const realBuyItAgain = availableItems.filter(i => i.inStock && pastBoughtIds.has(i._id.toString()));
      const finalBuyItAgain = realBuyItAgain.length > 0 ? realBuyItAgain.slice(0, 12) : availableItems.filter(i => i.inStock).sort(() => 0.5 - Math.random()).slice(0, 12);
      setBuyItAgain(finalBuyItAgain);

      const hour = new Date().getHours();
      let timeTitle = ""; let timeSubtitle = ""; let keywords = [];
      if (hour >= 5 && hour < 11) { timeTitle = "🌤️ Breakfast & Dairy"; timeSubtitle = "Start your morning right"; keywords = ["dairy", "bread", "milk", "eggs", "breakfast"]; }
      else if (hour >= 11 && hour < 16) { timeTitle = "⚡ Mid-Day Energy Boost"; timeSubtitle = "Keep the momentum going"; keywords = ["snacks", "drinks", "beverages", "chips"]; }
      else if (hour >= 16 && hour < 22) { timeTitle = "🌙 Evening Cravings"; timeSubtitle = "Perfect time for a snack"; keywords = ["ice cream", "maggi", "noodles", "chocolate"]; }
      else { timeTitle = "🦉 Late Night Essentials"; timeSubtitle = "We are still awake for you"; keywords = ["snacks", "beverages", "noodles", "condoms"]; }

      const matchedItems = availableItems.filter(i => i.inStock && keywords.some(kw => (i.category || "").toLowerCase().includes(kw) || (i.name || "").toLowerCase().includes(kw)));
      const finalTimeBased = { title: timeTitle, subtitle: timeSubtitle, items: matchedItems.length > 0 ? matchedItems.slice(0, 12) : availableItems.filter(i => i.inStock).slice(0, 12) };
      setTimeBased(finalTimeBased);

      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          items: availableItems,
          shopInfo: newShopInfo,
          nearbyShops: newNearbyShops,
          shopDeals: newShopDeals,
          shopBestSellers: newBestSellers,
          under99: newUnder99,
          newArrivals: newArrivalsList,
          buyItAgain: finalBuyItAgain,
          timeBased: finalTimeBased,
        }));
      } catch (e) { /* quota or serialization error — non-fatal */ }

      setLoading(false);
    };

    fetchShopProducts().catch(err => {
      if (cancelled) return;
      console.error("Feed Load Error:", err);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [user]);

  // Return all the calculated data back to the component!
  return { loading, items, shopInfo, nearbyShops, shopDeals, shopBestSellers, under99, timeBased, newArrivals, buyItAgain };
    }

import { useState, useEffect } from 'react';

const BASE_URL = (import.meta.env.VITE_API_BASE || "https://darkslategrey-snail-415133.hostingersite.com");

const FEED_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000; 
const MASTER_CACHE_KEY = 'packitout_master_products_v1';
const MASTER_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

const readMaster = () => {
  try {
    const raw = localStorage.getItem(MASTER_CACHE_KEY);
    if (!raw) return null;
    const { at, data } = JSON.parse(raw);
    if (!at || Date.now() - at > MASTER_CACHE_MAX_AGE_MS) return null;
    return Array.isArray(data) ? data : null;
  } catch { return null; }
};

export default function useShopFeedData(user) {
  const initialCache = (() => {
    if (!user || !user.primaryShop) return null;
    const shopId = typeof user.primaryShop === 'object' ? user.primaryShop._id : user.primaryShop;
    try {
      const raw = localStorage.getItem(`packitout_feed_cache_v2_${shopId}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed?.cachedAt && Date.now() - parsed.cachedAt > FEED_CACHE_MAX_AGE_MS) return null;
      return parsed;
    } catch (e) { return null; }
  })();

  const [loading, setLoading] = useState(initialCache ? false : true);
  
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
    const cacheKey = `packitout_feed_cache_v2_${shopId}`;
    let cancelled = false;

    const fetchJson = (url) => fetch(url).then(r => r.ok ? r.json() : null).catch(() => null);

    const fetchShopProducts = async () => {
      const cachedMaster = readMaster();
      const masterPromise = cachedMaster
        ? Promise.resolve(cachedMaster)
        : fetchJson(`${BASE_URL}/master-products`);

      // 🏎️ PHASE 1: CRITICAL PATH (Only fetch products to paint the screen instantly)
      const [shopData, masterProducts] = await Promise.all([
        fetchJson(`${BASE_URL}/shops/${shopId}/menu/lean?t=${Date.now()}`),
        masterPromise,
      ]);

      if (!cachedMaster && Array.isArray(masterProducts)) {
        try { localStorage.setItem(MASTER_CACHE_KEY, JSON.stringify({ at: Date.now(), data: masterProducts })); } catch {}
      }

      if (cancelled) return;

      if (!shopData) {
        setLoading(false);
        return;
      }

      const newShopInfo = { name: shopData.name, isOpen: shopData.isOpen };
      setShopInfo(newShopInfo);

      const masterMap = new Map();
      if (Array.isArray(masterProducts)) {
        masterProducts.forEach(mp => {
          if (mp && mp._id) masterMap.set(String(mp._id), mp);
        });
      }

      const groupedMap = new Map();
      const availableItems = [];

      shopData.inventory?.filter(item => item && item.product).forEach(item => {
        const pid = String(item.product._id || '');
        const master = masterMap.get(pid) || {};
        const productMerged = { ...master, ...item.product };

        const mrp = Number(productMerged.mrp || 0);
        const sellingPrice = (item.sellingPrice !== undefined && item.sellingPrice !== null) ? Number(item.sellingPrice) : mrp;
        const isDiscounted = mrp > 0 && sellingPrice < mrp;
        const discountPercent = (isDiscounted && mrp > 0) ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0;

        const formattedItem = { ...productMerged, sellingPrice, mrp, inStock: item.inStock, isDiscounted, discountPercent };

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

      const hour = new Date().getHours();
      let timeTitle = ""; let timeSubtitle = ""; let keywords = [];
      if (hour >= 5 && hour < 11) { timeTitle = "🌤️ Breakfast & Dairy"; timeSubtitle = "Start your morning right"; keywords = ["dairy", "bread", "milk", "eggs", "breakfast"]; }
      else if (hour >= 11 && hour < 16) { timeTitle = "⚡ Mid-Day Energy Boost"; timeSubtitle = "Keep the momentum going"; keywords = ["snacks", "drinks", "beverages", "chips"]; }
      else if (hour >= 16 && hour < 22) { timeTitle = "🌙 Evening Cravings"; timeSubtitle = "Perfect time for a snack"; keywords = ["ice cream", "maggi", "noodles", "chocolate"]; }
      else { timeTitle = "🦉 Late Night Essentials"; timeSubtitle = "We are still awake for you"; keywords = ["snacks", "beverages", "noodles", "condoms"]; }

      const matchedItems = availableItems.filter(i => i.inStock && keywords.some(kw => (i.category || "").toLowerCase().includes(kw) || (i.name || "").toLowerCase().includes(kw)));
      const finalTimeBased = { title: timeTitle, subtitle: timeSubtitle, items: matchedItems.length > 0 ? matchedItems.slice(0, 12) : availableItems.filter(i => i.inStock).slice(0, 12) };
      setTimeBased(finalTimeBased);

      // ⚡⚡⚡ UI UNBLOCKS HERE: Drop the loading screen IMMEDIATELY!
      setLoading(false);

      // 👻 PHASE 2: BACKGROUND FETCHES (Runs silently, does not block the user)
      let finalNearbyShops = [];
      let finalBuyItAgain = [];

      const bgPromises = [];

      if (user.pincode) {
        bgPromises.push(
          fetchJson(`${BASE_URL}/shops/all/${user.pincode}`).then(shopsData => {
            if (cancelled || !Array.isArray(shopsData)) return;
            finalNearbyShops = shopsData.filter(s => s._id !== shopId);
            setNearbyShops(finalNearbyShops);
          })
        );
      }

      if (user._id) {
        bgPromises.push(
          fetchJson(`${BASE_URL}/orders/user/${user._id}`).then(userOrders => {
            if (cancelled || !Array.isArray(userOrders)) return;
            const pastBoughtIds = new Set();
            userOrders.forEach(order => {
              order.items?.forEach(orderedItem => {
                const pId = orderedItem.product?._id || orderedItem.product || orderedItem._id || orderedItem.productId;
                if (pId) pastBoughtIds.add(pId.toString());
              });
            });
            const realBuyItAgain = availableItems.filter(i => i.inStock && pastBoughtIds.has(i._id.toString()));
            finalBuyItAgain = realBuyItAgain.length > 0 ? realBuyItAgain.slice(0, 12) : availableItems.filter(i => i.inStock).sort(() => 0.5 - Math.random()).slice(0, 12);
            setBuyItAgain(finalBuyItAgain);
          })
        );
      }

      // Once background data arrives, save the fully completed state to cache
      Promise.all(bgPromises).then(() => {
        if (cancelled) return;
        try {
          localStorage.setItem(cacheKey, JSON.stringify({
            cachedAt: Date.now(),
            items: availableItems,
            shopInfo: newShopInfo,
            nearbyShops: finalNearbyShops,
            shopDeals: newShopDeals,
            shopBestSellers: newBestSellers,
            under99: newUnder99,
            newArrivals: newArrivalsList,
            buyItAgain: finalBuyItAgain,
            timeBased: finalTimeBased,
          }));
        } catch (e) { }
      });

    };

    fetchShopProducts().catch(err => {
      if (cancelled) return;
      console.error("Feed Load Error:", err);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [user]);

  return { loading, items, shopInfo, nearbyShops, shopDeals, shopBestSellers, under99, timeBased, newArrivals, buyItAgain };
}

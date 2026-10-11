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

const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export default function useShopFeedData(user) {
  const [initialCache] = useState(() => {
    if (!user || !user.primaryShop) return null;
    const shopId = typeof user.primaryShop === 'object' ? user.primaryShop._id : user.primaryShop;
    try {
      const raw = localStorage.getItem(`packitout_feed_cache_v2_${shopId}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed?.cachedAt && Date.now() - parsed.cachedAt > FEED_CACHE_MAX_AGE_MS) return null;
      return parsed;
    } catch (e) { return null; }
  });

  const [loading, setLoading] = useState(initialCache ? false : true);
  
  const [items, setItems] = useState(initialCache?.items || []);
  const [shopInfo, setShopInfo] = useState(initialCache?.shopInfo || null);
  const [nearbyShops, setNearbyShops] = useState(initialCache?.nearbyShops || []);
  const [shopRecommendations, setShopRecommendations] = useState(initialCache?.shopRecommendations || []);
  const [shopCombos, setShopCombos] = useState(initialCache?.shopCombos || []);
  const [campaigns, setCampaigns] = useState(initialCache?.campaigns || []);
  const [shopDeals, setShopDeals] = useState(() => initialCache?.shopDeals ? shuffleArray(initialCache.shopDeals) : []);
  const [shopBestSellers, setShopBestSellers] = useState(() => initialCache?.shopBestSellers ? shuffleArray(initialCache.shopBestSellers) : []);
  const [under99, setUnder99] = useState(() => initialCache?.under99 ? shuffleArray(initialCache.under99) : []);
  const [timeBased, setTimeBased] = useState(initialCache?.timeBased || { title: "", subtitle: "", items: [] });
  const [newArrivals, setNewArrivals] = useState(initialCache?.newArrivals || []);
  const [buyItAgain, setBuyItAgain] = useState(() => initialCache?.buyItAgain ? shuffleArray(initialCache.buyItAgain) : []);

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
      try { localStorage.setItem('packitout_active_shop', JSON.stringify({ _id: shopData._id, name: shopData.name, pincode: shopData.pincode })); } catch (e) {}

      const masterMap = new Map();
      if (Array.isArray(masterProducts)) {
        masterProducts.forEach(mp => {
          if (mp && mp._id) masterMap.set(String(mp._id), mp);
        });
      }

      // 🧬 SMART VARIANT GROUPING KEY
      // Automatically clusters variants (e.g. Amul Lassi 250ml, 200ml, 1L) into one family card
      const getVariantGroupingKey = (prod) => {
        if (prod.itemGroupId && String(prod.itemGroupId).trim() !== "") {
          return 'GRP_' + String(prod.itemGroupId).trim().toUpperCase();
        }
        const rawName = String(prod.name || '').toLowerCase();
        const rawBrand = String(prod.brand || '').toLowerCase().trim();
        const baseName = rawName
          .replace(/\b\d+(\.\d+)?\s*(ml|l|ltr|litres?|liter|g|gm|gms|kg|kgs|pcs?|pieces?|pack|units?)\b/gi, '')
          .replace(/[([{\-].*?[)\]}]/g, '')
          .replace(/[^a-z0-9]/g, ' ')
          .trim()
          .replace(/\s+/g, ' ');

        if (!baseName || baseName.length < 3) return 'SINGLE_' + (prod._id || Math.random());
        return `FAMILY_${rawBrand}_${baseName}`;
      };

      const groupedMap = new Map();
      const availableItems = [];

      shopData.inventory?.filter(item => item && item.product).forEach(item => {
        const pid = String(item.product._id || item.product || '');
        const master = masterMap.get(pid) || {};
        const productMerged = typeof item.product === 'object' && item.product._id ? { ...master, ...item.product } : { ...master, _id: pid };

        const mrp = Number(productMerged.mrp || 0);
        const sellingPrice = (item.sellingPrice !== undefined && item.sellingPrice !== null) ? Number(item.sellingPrice) : mrp;
        const isDiscounted = mrp > 0 && sellingPrice < mrp;
        const discountPercent = (isDiscounted && mrp > 0) ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0;

        const formattedItem = {
          ...productMerged,
          sellingPrice,
          mrp,
          inStock: item.inStock,
          isFeatured: item.isFeatured,
          featuredRank: item.featuredRank !== undefined ? Number(item.featuredRank) : 999,
          isDiscounted,
          discountPercent
        };

        const groupKey = getVariantGroupingKey(formattedItem);
        if (!groupedMap.has(groupKey)) {
          formattedItem.variants = [{ ...formattedItem }];
          groupedMap.set(groupKey, formattedItem);
          availableItems.push(formattedItem);
        } else {
          const parent = groupedMap.get(groupKey);
          parent.variants.push({ ...formattedItem });
          // If any variant is in stock, mark parent as in stock
          if (formattedItem.inStock) parent.inStock = true;
          // Inherit featured status and lowest rank
          if (formattedItem.isFeatured) {
            parent.isFeatured = true;
            parent.featuredRank = Math.min(parent.featuredRank ?? 999, formattedItem.featuredRank ?? 999);
          }
        }
      });

      setItems(availableItems);

      // ⭐ SHOPKEEPER'S PICKS: Sort strictly by shopkeeper's assigned featuredRank (#1, #2, #3...)
      const newShopRecommendations = availableItems
        .filter(i => i.isFeatured && i.inStock)
        .sort((a, b) => (Number(a.featuredRank ?? 999)) - (Number(b.featuredRank ?? 999)));

      // Take top 30 deals and shuffle them, then pick 12
      const topDeals = availableItems.filter(i => i.isDiscounted && i.inStock).sort((a, b) => b.discountPercent - a.discountPercent).slice(0, 30);
      const newShopDeals = shuffleArray(topDeals).slice(0, 12);
      // Top picks and under 99 are completely randomized from inventory to keep it fresh
      const newBestSellers = shuffleArray(availableItems.filter(i => i.inStock)).slice(0, 12);
      const newUnder99 = shuffleArray(availableItems.filter(i => i.sellingPrice > 0 && i.sellingPrice < 100 && i.inStock)).slice(0, 12);
      const newArrivalsList = [...availableItems].reverse().filter(i => i.inStock).slice(0, 12);

      const newShopCombos = newShopInfo.combos ? newShopInfo.combos.filter(c => c.isActive) : [];

      setShopRecommendations(newShopRecommendations);
      setShopCombos(newShopCombos);
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
      let finalCampaigns = [];

      const bgPromises = [];

      bgPromises.push(
        fetchJson(`${BASE_URL}/campaigns`).then(data => {
          if (cancelled || !Array.isArray(data)) return;
          finalCampaigns = data;
          setCampaigns(finalCampaigns);
        }).catch(() => null)
      );

      if (user.pincode) {
        bgPromises.push(
          fetchJson(`${BASE_URL}/shops/all/${user.pincode}`).then(shopsData => {
            if (cancelled || !Array.isArray(shopsData)) return;
            finalNearbyShops = shopsData.filter(s => s._id !== shopId);
            setNearbyShops(finalNearbyShops);
          })
        );
      }

      if (user._id && user.sessionToken) {
        bgPromises.push(
          fetch(`${BASE_URL}/orders/user/${user._id}`, {
            headers: { Authorization: `Bearer ${user.sessionToken}` }
          }).then(r => r.ok ? r.json() : null)
          .then(userOrders => {
            if (cancelled || !Array.isArray(userOrders)) return;
            const pastBoughtIds = new Set();
            for (const order of userOrders) {
              order.items?.forEach(orderedItem => {
                const pId = orderedItem.product?._id || orderedItem.product || orderedItem._id || orderedItem.productId;
                if (pId) pastBoughtIds.add(pId.toString());
              });
              if (pastBoughtIds.size >= 15) break; // Only take most recent unique items
            }
            const realBuyItAgain = availableItems.filter(i => i.inStock && pastBoughtIds.has(i._id.toString()));
            finalBuyItAgain = realBuyItAgain.length > 0 ? shuffleArray(realBuyItAgain).slice(0, 12) : shuffleArray(availableItems.filter(i => i.inStock)).slice(0, 12);
            setBuyItAgain(finalBuyItAgain);
          }).catch(() => null)
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
            shopRecommendations: newShopRecommendations,
            shopCombos: newShopCombos,
            campaigns: finalCampaigns,
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

  return { loading, items, shopInfo, nearbyShops, shopRecommendations, shopCombos, campaigns, shopDeals, shopBestSellers, under99, timeBased, newArrivals, buyItAgain };
}

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
  const shopId = typeof user?.primaryShop === 'object' ? user?.primaryShop?._id : user?.primaryShop;
  const userId = user?._id || 'guest';
  const cacheKey = `packitout_feed_cache_v3_${shopId}`;

  const [initialCache] = useState(() => {
    if (!shopId) return null;
    try {
      // Clear legacy cache keys
      localStorage.removeItem(`packitout_feed_cache_${shopId}`);
      localStorage.removeItem(`packitout_feed_cache_v2_${shopId}`);

      const raw = localStorage.getItem(cacheKey);
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
  const [shopDeals, setShopDeals] = useState(initialCache?.shopDeals || []);
  const [shopBestSellers, setShopBestSellers] = useState(initialCache?.shopBestSellers || []);
  const [under99, setUnder99] = useState(initialCache?.under99 || []);
  const [timeBased, setTimeBased] = useState(initialCache?.timeBased || { title: "", subtitle: "", items: [] });
  const [newArrivals, setNewArrivals] = useState(initialCache?.newArrivals || []);
  const [buyItAgain, setBuyItAgain] = useState(initialCache?.buyItAgain || []);

  useEffect(() => {
    if (!shopId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const fetchJson = (url) => fetch(url).then(r => r.ok ? r.json() : null).catch(() => null);

    const fetchShopProducts = async () => {
      const cachedMaster = readMaster();
      const masterPromise = cachedMaster
        ? Promise.resolve(cachedMaster)
        : fetchJson(`${BASE_URL}/master-products`);

      // 🏎️ PHASE 1: CRITICAL PATH (Fetch shop inventory and paint immediately)
      // Since menu/lean populates inventory.product with essential fields (name, image, brand, mrp, etc.),
      // we do NOT block the screen on the heavy /master-products catalog download.
      const shopData = await fetchJson(`${BASE_URL}/shops/${shopId}/menu/lean?t=${Date.now()}`);

      // Background load & cache master products if not already cached
      let masterProducts = cachedMaster;
      masterPromise.then(res => {
        if (!cachedMaster && Array.isArray(res)) {
          try { localStorage.setItem(MASTER_CACHE_KEY, JSON.stringify({ at: Date.now(), data: res })); } catch {}
        }
      });

      if (cancelled) return;

      if (!shopData) {
        setLoading(false);
        return;
      }

      const newShopInfo = { 
        name: shopData.name, 
        isOpen: shopData.isOpen,
        combos: shopData.combos || []
      };
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
        const rawBrand = (!prod.brand || String(prod.brand).toLowerCase() === 'nan') ? '' : String(prod.brand).toLowerCase().trim();
        let baseName = String(prod.name || '').toLowerCase();

        // 1. Remove unit volumes and weight numbers
        baseName = baseName.replace(/\b\d+(\.\d+)?\s*(ml|l|ltr|litres?|liter|g|gm|gms|kg|kgs|pcs?|pieces?|pack|units?)\b/gi, '');
        // 2. Remove parenthetical descriptions like (Pouch), (Tetra Pack), (Bottle), (Jar)
        baseName = baseName.replace(/[([{\-].*?[)\]}]/g, '');
        // 3. Remove packaging keywords
        baseName = baseName.replace(/\b(pouch|tetra\s*pack|tetrapak|bottle|pet\s*bottle|carton|box|jar|can|tin|poly\s*pack)\b/gi, '');
        // 4. Remove brand word from baseName to allow uniform family matching
        if (rawBrand) {
          baseName = baseName.replace(new RegExp(`\\b${rawBrand}\\b`, 'gi'), '');
        }
        baseName = baseName.replace(/[^a-z0-9]/g, ' ').trim().replace(/\s+/g, ' ');

        if (!baseName || baseName.length < 2) return 'SINGLE_' + (prod._id || Math.random());
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

      // Stable order on fetch so scrolling up and down doesn't shift items
      const topDeals = availableItems.filter(i => i.isDiscounted && i.inStock).sort((a, b) => b.discountPercent - a.discountPercent).slice(0, 30);
      const newShopDeals = shuffleArray(topDeals).slice(0, 12);
      const newBestSellers = shuffleArray(availableItems.filter(i => i.inStock)).slice(0, 12);
      const newUnder99 = shuffleArray(availableItems.filter(i => i.sellingPrice > 0 && i.sellingPrice < 100 && i.inStock)).slice(0, 12);
      const newArrivalsList = [...availableItems].reverse().filter(i => i.inStock).slice(0, 12);

      const newShopCombos = (shopData.combos || []).filter(c => c.isActive !== false);

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

      // 🐢 PHASE 2: BACKGROUND HYDRATION
      let finalCampaigns = [];
      let finalNearbyShops = [];
      let finalBuyItAgain = [];

      const bgPromises = [
        fetchJson(`${BASE_URL}/campaigns`).then(data => {
          if (cancelled) return;
          finalCampaigns = Array.isArray(data) ? data.filter(c => c.isActive) : [];
          setCampaigns(finalCampaigns);
        }),
      ];

      const pin = user?.pincode;
      if (pin) {
        bgPromises.push(
          fetchJson(`${BASE_URL}/shops/nearby?pincode=${pin}`).then(data => {
            if (cancelled) return;
            const otherShops = Array.isArray(data) ? data.filter(s => s._id !== shopId) : [];
            finalNearbyShops = otherShops;
            setNearbyShops(otherShops);
          })
        );
      }

      if (user?._id) {
        bgPromises.push(
          fetchJson(`${BASE_URL}/orders/user/${user._id}`).then(orders => {
            if (cancelled) return;
            const pastBoughtIds = new Set();
            if (Array.isArray(orders)) {
              orders.forEach(ord => {
                ord.items?.forEach(itemRow => {
                  const pid = itemRow.product?._id || itemRow.product || itemRow.productId;
                  if (pid) pastBoughtIds.add(pid.toString());
                });
              });
            }
            const realBuyItAgain = availableItems.filter(i => i.inStock && pastBoughtIds.has(i._id.toString()));
            finalBuyItAgain = realBuyItAgain.length > 0 ? realBuyItAgain.slice(0, 12) : availableItems.filter(i => i.inStock).slice(0, 12);
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
  }, [shopId, userId]);

  return { loading, items, shopInfo, nearbyShops, shopRecommendations, shopCombos, campaigns, shopDeals, shopBestSellers, under99, timeBased, newArrivals, buyItAgain };
}

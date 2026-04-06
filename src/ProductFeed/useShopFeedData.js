import { useState, useEffect } from 'react';

const BASE_URL = "https://darkslategrey-snail-415133.hostingersite.com";

export default function useShopFeedData(user) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shopInfo, setShopInfo] = useState(null);
  const [nearbyShops, setNearbyShops] = useState([]);
  
  const [shopDeals, setShopDeals] = useState([]);
  const [shopBestSellers, setShopBestSellers] = useState([]);
  const [under99, setUnder99] = useState([]);
  const [timeBased, setTimeBased] = useState({ title: "", subtitle: "", items: [] });
  const [newArrivals, setNewArrivals] = useState([]);
  const [buyItAgain, setBuyItAgain] = useState([]);

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
        
        setShopDeals(availableItems.filter(i => i.isDiscounted && i.inStock).sort((a, b) => b.discountPercent - a.discountPercent).slice(0, 12));
        setShopBestSellers(availableItems.filter(i => i.inStock).slice(0, 12));
        setUnder99(availableItems.filter(i => i.sellingPrice > 0 && i.sellingPrice < 100 && i.inStock).slice(0, 12));
        setNewArrivals([...availableItems].reverse().filter(i => i.inStock).slice(0, 12));
        
        // --- SMART "BUY IT AGAIN" ---
        let pastBoughtIds = new Set();
        try {
          const ordersRes = await fetch(`${BASE_URL}/orders`);
          const allOrders = await ordersRes.json();
          const myOrders = allOrders.filter(o => o.userId?._id === user._id || o.userId === user._id);
          myOrders.forEach(order => {
            order.items?.forEach(orderedItem => {
              const pId = orderedItem.product?._id || orderedItem.product || orderedItem._id || orderedItem.productId;
              if (pId) pastBoughtIds.add(pId.toString());
            });
          });
        } catch (err) { console.log("Could not load past orders"); }

        const realBuyItAgain = availableItems.filter(i => i.inStock && pastBoughtIds.has(i._id.toString()));
        setBuyItAgain(realBuyItAgain.length > 0 ? realBuyItAgain.slice(0, 12) : availableItems.filter(i => i.inStock).sort(() => 0.5 - Math.random()).slice(0, 12));

        // --- TIME BASED LOGIC ---
        const hour = new Date().getHours();
        let timeTitle = ""; let timeSubtitle = ""; let keywords = [];
        if (hour >= 5 && hour < 11) { timeTitle = "🌤️ Breakfast & Dairy"; timeSubtitle = "Start your morning right"; keywords = ["dairy", "bread", "milk", "eggs", "breakfast"]; } 
        else if (hour >= 11 && hour < 16) { timeTitle = "⚡ Mid-Day Energy Boost"; timeSubtitle = "Keep the momentum going"; keywords = ["snacks", "drinks", "beverages", "chips"]; } 
        else if (hour >= 16 && hour < 22) { timeTitle = "🌙 Evening Cravings"; timeSubtitle = "Perfect time for a snack"; keywords = ["ice cream", "maggi", "noodles", "chocolate"]; } 
        else { timeTitle = "🦉 Late Night Essentials"; timeSubtitle = "We are still awake for you"; keywords = ["snacks", "beverages", "noodles", "condoms"]; }

        const matchedItems = availableItems.filter(i => i.inStock && keywords.some(kw => (i.category || "").toLowerCase().includes(kw) || (i.name || "").toLowerCase().includes(kw)));
        setTimeBased({ title: timeTitle, subtitle: timeSubtitle, items: matchedItems.length > 0 ? matchedItems.slice(0, 12) : availableItems.filter(i => i.inStock).slice(0, 12) });

      } catch (err) { console.error("Feed Load Error:", err); }
      setLoading(false);
    };

    fetchShopProducts();
  }, [user]);

  // Return all the calculated data back to the component!
  return { loading, items, shopInfo, nearbyShops, shopDeals, shopBestSellers, under99, timeBased, newArrivals, buyItAgain };
}

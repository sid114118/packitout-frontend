import React, { useMemo } from 'react';
import { ModernProductCard } from './FeedComponents.jsx'; 

// 🧠 SMART PAIRING ALGORITHM (Built right into the component!)
const getAutoCrossSellItems = (currentProduct, fullShopInventory) => {
  if (!currentProduct || !fullShopInventory || fullShopInventory.length === 0) return [];

  const currentCategory = currentProduct.category || currentProduct.product?.category;
  const currentId = currentProduct._id || currentProduct.product?._id;

  // 📖 THE SMART RULEBOOK
  const pairingRules = {
    "Dairy, Bread & Eggs": ["Tea & Coffee", "Sauces & Spreads", "Bakery & Biscuits"],
    "Chips & Namkeen": ["Drinks & Juices", "Sweets & Chocolates"],
    "Drinks & Juices": ["Chips & Namkeen", "Ice Creams", "Sweets & Chocolates"],
    "Tea & Coffee": ["Bakery & Biscuits", "Dairy, Bread & Eggs"],
    "Atta & Rice": ["Dals & Pulses", "Oil, Ghee & Salt", "Spices & Condiments"],
    "Dals & Pulses": ["Atta & Rice", "Spices & Condiments"],
    "Bath & Body": ["Beauty & Grooming", "Hair Care"],
    "Fruits & Veg": ["Dairy, Bread & Eggs", "Healthy & Diet Snacks"],
    "Instant Food": ["Drinks & Juices", "Chips & Namkeen"]
  };

  const targetCategories = pairingRules[currentCategory] || [currentCategory];

  // 1. Filter the inventory based on target categories
  let suggested = fullShopInventory.filter(item => {
    const itemCategory = item.product?.category || item.category;
    const itemId = item.product?._id || item._id;
    
    const inStock = item.inStock !== false;
    const isNotCurrent = itemId !== currentId;
    const isMatchingCategory = targetCategories.includes(itemCategory);

    return inStock && isNotCurrent && isMatchingCategory;
  });

  // 2. Fallback: If no complementary items, show items from the SAME category
  if (suggested.length === 0) {
    suggested = fullShopInventory.filter(item => {
      const itemCategory = item.product?.category || item.category;
      const itemId = item.product?._id || item._id;
      return (item.inStock !== false) && (itemId !== currentId) && (itemCategory === currentCategory);
    });
  }

  // 3. Shuffle and pick top 6
  return suggested.sort(() => 0.5 - Math.random()).slice(0, 6);
};


export default function CrossSellSlider({ 
  title = "Pairs well with this", 
  allItems, 
  currentProduct, 
  onProductClick, 
  onAddToCart 
}) {
  
  // 🚀 The Logic automatically runs here using the data passed from ProductModal!
  const items = useMemo(() => {
    return getAutoCrossSellItems(currentProduct, allItems);
  }, [currentProduct, allItems]);

  if (!items || items.length === 0) return null;

  return (
    <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #e2e8f0' }}>
      <h3 style={{ fontSize: '0.95rem', color: '#0f172a', margin: '0 0 12px 0', fontWeight: 'bold' }}>
        {title}
      </h3>
      
      {/* Scrollable Container */}
      <div className="hide-scroll" style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '10px', scrollSnapType: 'x mandatory' }}>
        {items.map(item => (
          <ModernProductCard 
            key={item._id || item.product?._id} 
            item={item} 
            isCarousel={true} 
            shopClosed={false} 
            onOpenDetails={onProductClick} 
            onQuickAdd={(itemToAdd) => {
              onAddToCart({ ...itemToAdd, mrp: itemToAdd.sellingPrice || itemToAdd.mrp });
            }} 
          />
        ))}
      </div>
    </div>
  );
}

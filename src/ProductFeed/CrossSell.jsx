import React from 'react';
import { ModernProductCard } from './FeedComponents.jsx'; // 👈 We import the exact same card used everywhere else!

export default function CrossSellSlider({ title, items, onProductClick, onAddToCart }) {
  if (!items || items.length === 0) return null;

  return (
    <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #e2e8f0' }}>
      <h3 style={{ fontSize: '0.95rem', color: '#0f172a', margin: '0 0 12px 0', fontWeight: 'bold' }}>
        {title}
      </h3>
      
      {/* Scrollable Container just like the Feed rows */}
      <div className="hide-scroll" style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '10px', scrollSnapType: 'x mandatory' }}>
        {items.map(item => (
          <ModernProductCard 
            key={item._id} 
            item={item} 
            isCarousel={true} 
            shopClosed={false} 
            onOpenDetails={onProductClick} // 👈 Clicking the image updates the modal
            onQuickAdd={(itemToAdd) => {
              // 👈 Clicking ADD puts it straight into the cart!
              onAddToCart({ ...itemToAdd, mrp: itemToAdd.sellingPrice || itemToAdd.mrp });
            }} 
          />
        ))}
      </div>
    </div>
  );
}

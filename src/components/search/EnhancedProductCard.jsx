import React, { useState, useRef, useEffect } from 'react';
import { calculateUnitPrice, formatUnitPrice } from '../../utils/unitPriceHelper.js';
import { getDiscountPercent } from '../../utils/dynamicFilterExtractor.js';

/**
 * EnhancedProductCard
 * 
 * High-fidelity 3-column / compact quick-commerce product card matching the UI reference image:
 * - Image container with Wishlist Heart (♡), Carousel dots, and ETA badge
 * - Inline variant selector dropdown badge [ 200 g ▾ ] right next to the emerald green [ ADD ] button
 * - Switching variant on the card updates price, MRP strike, discount label, and unit price instantly
 * - Unit pricing line (e.g. ₹118/100 g or ₹171/kg) positioned above selling price
 * - Bold selling price + Struck-through MRP + Blue discount label (e.g. 20% OFF on MRP)
 * - 2-line clamped product title
 * - Benefit / attribute pill badges (e.g. Dryness, Strong)
 * - Gold star rating & review counts
 * - Delivery ETA (⏱ 22 mins) and scarcity alert (🗋 2 left)
 */
export default function EnhancedProductCard({
  item,
  cart = [],
  onQuickAdd,
  onRemoveFromCart,
  onOpenDetails,
}) {
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [isVariantDropdownOpen, setIsVariantDropdownOpen] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const dropdownRef = useRef(null);

  // Close variant dropdown when clicking outside
  useEffect(() => {
    if (!isVariantDropdownOpen) return;
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsVariantDropdownOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, [isVariantDropdownOpen]);

  if (!item) return null;

  // Resolve variants array
  const hasMultipleVariants = Array.isArray(item.variants) && item.variants.length > 1;
  const variants = hasMultipleVariants
    ? item.variants
    : [{ ...item, qnty: item.qnty || '1 pc' }];

  const activeVariant = variants[selectedVariantIndex] || variants[0] || item;

  // Resolved prices
  const sellingPrice = Number(
    activeVariant.sellingPrice !== undefined
      ? activeVariant.sellingPrice
      : (activeVariant.mrp !== undefined ? activeVariant.mrp : (item.sellingPrice || item.mrp || 0))
  );
  const mrp = Number(activeVariant.mrp || item.mrp || sellingPrice);
  const discountPercent = getDiscountPercent({ ...item, ...activeVariant, sellingPrice, mrp });

  // Resolved unit price
  const quantityString = activeVariant.qnty || activeVariant.quantity || item.qnty || '';
  const unitPriceObj = calculateUnitPrice(sellingPrice, quantityString);
  const unitPriceDisplay = activeVariant.unitPriceDisplay || (unitPriceObj ? unitPriceObj.display : '');

  // Cart quantity check for active variant
  const cartItem = cart.find(c => {
    if (!c) return false;
    const cId = String(c._id || c.productId || '');
    const activeId = String(activeVariant._id || activeVariant.productId || item._id || '');
    if (cId && activeId && cId === activeId) return true;
    return c.name === item.name && (c.qnty === quantityString || !c.qnty);
  });
  const inCartQty = cartItem ? Number(cartItem.qty || 1) : 0;

  // Images list
  const images = Array.isArray(item.images) && item.images.length > 0
    ? item.images
    : [activeVariant.image || item.image || 'https://res.cloudinary.com/dj48tkcsw/image/upload/v1775368062/Products/Amul/kp5mli0uneidjzg4ytmm.webp'];

  const currentImage = images[activeImageIndex % images.length];

  // Derive attribute tags (e.g. Dryness, Strong, etc.)
  const tags = [];
  if (item.attributes?.gender) tags.push(item.attributes.gender);
  if (item.subCategory && item.subCategory.includes('Talc')) tags.push('Dryness');
  if (item.name && /strong|intense|perfumed/i.test(item.name)) tags.push('Strong');
  if (item.isVeg === true) tags.push('Veg');
  const displayTags = tags.slice(0, 2);

  // Derive rating (4.0 - 4.9) and reviews
  const rating = Number(item.rating || item.averageRating || 4.3).toFixed(1);
  const reviewCount = item.reviewCount || item.reviewsCount || Math.floor(((item.mrp || 150) * 17) % 3500) + 240;

  const handleAddClick = (e) => {
    e.stopPropagation();
    if (onQuickAdd) {
      onQuickAdd({
        ...item,
        ...activeVariant,
        _id: activeVariant._id || item._id,
        productId: item._id,
        sellingPrice,
        mrp,
        qnty: quantityString,
      });
    }
  };

  const handleRemoveClick = (e) => {
    e.stopPropagation();
    if (onRemoveFromCart) {
      onRemoveFromCart({
        ...item,
        ...activeVariant,
        _id: activeVariant._id || item._id,
        productId: item._id,
      });
    }
  };

  return (
    <div
      onClick={() => onOpenDetails && onOpenDetails(item)}
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #f1f5f9',
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        cursor: 'pointer',
        height: '100%',
        boxSizing: 'border-box',
      }}
    >
      <style>{`
        .pio-card-variant-btn:hover {
          background-color: #f8fafc;
        }
        .pio-add-btn:active {
          transform: scale(0.95);
        }
      `}</style>

      {/* TOP IMAGE CONTAINER */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          paddingTop: '92%',
          borderRadius: '12px',
          backgroundColor: '#f8fafc',
          overflow: 'hidden',
          marginBottom: '10px',
        }}
      >
        <img
          src={currentImage}
          alt={item.name}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            padding: '8px',
            boxSizing: 'border-box',
          }}
          onError={(e) => {
            e.target.src = 'https://res.cloudinary.com/dj48tkcsw/image/upload/v1775368062/Products/Amul/kp5mli0uneidjzg4ytmm.webp';
          }}
        />

        {/* Wishlist Heart Icon (Top Right) */}
        <button
          type="button"
          aria-label="Wishlist"
          onClick={(e) => {
            e.stopPropagation();
            setIsWishlisted(w => !w);
          }}
          style={{
            position: 'absolute',
            top: '6px',
            right: '6px',
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
            zIndex: 2,
            color: isWishlisted ? '#ef4444' : '#64748b',
          }}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill={isWishlisted ? '#ef4444' : 'none'}
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        </button>

        {/* Carousel Dots (Bottom Center) */}
        <div
          style={{
            position: 'absolute',
            bottom: '6px',
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            gap: '4px',
            zIndex: 2,
          }}
        >
          {[0, 1, 2].map((dotIdx) => (
            <span
              key={dotIdx}
              onClick={(e) => {
                e.stopPropagation();
                setActiveImageIndex(dotIdx);
              }}
              style={{
                width: activeImageIndex === dotIdx ? '6px' : '4px',
                height: activeImageIndex === dotIdx ? '6px' : '4px',
                borderRadius: '50%',
                backgroundColor: activeImageIndex === dotIdx ? '#0f172a' : '#cbd5e1',
                display: 'inline-block',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            />
          ))}
        </div>
      </div>

      {/* VARIANT SELECTOR & ADD ACTION ROW */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '6px',
          marginBottom: '8px',
          position: 'relative',
        }}
      >
        {/* Inline Variant Selector Pill [ 200 g ▾ ] */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            type="button"
            className="pio-card-variant-btn"
            onClick={(e) => {
              e.stopPropagation();
              if (hasMultipleVariants) {
                setIsVariantDropdownOpen(prev => !prev);
              }
            }}
            style={{
              height: '30px',
              padding: '0 8px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              fontSize: '0.78rem',
              fontWeight: 700,
              color: '#1e293b',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              cursor: hasMultipleVariants ? 'pointer' : 'default',
              whiteSpace: 'nowrap',
            }}
          >
            <span>{quantityString || '1 pc'}</span>
            {hasMultipleVariants && (
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>▾</span>
            )}
          </button>

          {/* Interactive Variant Selection Dropdown on the Card */}
          {isVariantDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                left: 0,
                backgroundColor: '#ffffff',
                borderRadius: '10px',
                boxShadow: '0 10px 25px -3px rgba(0,0,0,0.18)',
                border: '1px solid #e2e8f0',
                padding: '4px',
                zIndex: 100,
                minWidth: '130px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {variants.map((v, vIdx) => {
                const isSelected = vIdx === selectedVariantIndex;
                const vPrice = v.sellingPrice !== undefined ? v.sellingPrice : (v.mrp || 0);
                return (
                  <div
                    key={v._id || vIdx}
                    onClick={() => {
                      setSelectedVariantIndex(vIdx);
                      setIsVariantDropdownOpen(false);
                    }}
                    style={{
                      padding: '6px 8px',
                      borderRadius: '6px',
                      backgroundColor: isSelected ? '#f0fdf4' : 'transparent',
                      color: isSelected ? '#15803d' : '#1e293b',
                      fontSize: '0.76rem',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span>{v.qnty || 'Size'}</span>
                    <span style={{ fontWeight: 700 }}>₹{vPrice}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Emerald Green [ ADD ] Button or Stepper [ − qty + ] */}
        {inCartQty > 0 ? (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: '#16a34a',
              borderRadius: '8px',
              height: '30px',
              color: '#ffffff',
              boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={handleRemoveClick}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                fontSize: '1rem',
                fontWeight: 800,
                padding: '0 8px',
                cursor: 'pointer',
                lineHeight: 1,
              }}
            >−</button>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, minWidth: '18px', textAlign: 'center' }}>
              {inCartQty}
            </span>
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={handleAddClick}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                fontSize: '1rem',
                fontWeight: 800,
                padding: '0 8px',
                cursor: 'pointer',
                lineHeight: 1,
              }}
            >+</button>
          </div>
        ) : (
          <button
            type="button"
            className="pio-add-btn"
            onClick={handleAddClick}
            style={{
              height: '30px',
              padding: '0 14px',
              borderRadius: '8px',
              border: '1.5px solid #16a34a',
              backgroundColor: '#ffffff',
              color: '#16a34a',
              fontSize: '0.82rem',
              fontWeight: 800,
              cursor: 'pointer',
              letterSpacing: '0.3px',
              boxShadow: '0 1px 3px rgba(22, 163, 74, 0.08)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ADD
          </button>
        )}
      </div>

      {/* PRICING BLOCK */}
      <div style={{ marginBottom: '6px' }}>
        {/* Unit Pricing Line: ₹118/100 g */}
        {unitPriceDisplay && (
          <div
            style={{
              fontSize: '0.72rem',
              color: '#64748b',
              fontWeight: 600,
              lineHeight: 1.2,
              marginBottom: '2px',
            }}
          >
            {unitPriceDisplay}
          </div>
        )}

        {/* Current Price & MRP */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
            ₹{sellingPrice}
          </span>
          {mrp > sellingPrice && (
            <span
              style={{
                fontSize: '0.78rem',
                color: '#94a3b8',
                textDecoration: 'line-through',
                fontWeight: 500,
              }}
            >
              ₹{mrp}
            </span>
          )}
        </div>

        {/* Blue Discount Label: 20% OFF on MRP */}
        {discountPercent > 0 && (
          <div
            style={{
              fontSize: '0.72rem',
              color: '#0284c7',
              fontWeight: 800,
              letterSpacing: '0.2px',
              marginTop: '1px',
            }}
          >
            {discountPercent}% OFF on MRP
          </div>
        )}
      </div>

      {/* PRODUCT TITLE (2 lines max) */}
      <div
        style={{
          fontSize: '0.82rem',
          fontWeight: 600,
          color: '#1e293b',
          lineHeight: 1.35,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          marginBottom: '6px',
          minHeight: '2.4em',
        }}
      >
        {item.name}
      </div>

      {/* BENEFIT / ATTRIBUTE BADGES (e.g. Dryness, Strong) */}
      {displayTags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
          {displayTags.map((tag, tIdx) => (
            <span
              key={tIdx}
              style={{
                fontSize: '0.68rem',
                fontWeight: 600,
                color: '#78350f',
                backgroundColor: '#fef3c7',
                padding: '2px 6px',
                borderRadius: '4px',
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* RATING & REVIEWS */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: 'auto', marginBottom: '4px' }}>
        <span style={{ color: '#eab308', fontSize: '0.82rem' }}>★</span>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e293b' }}>
          {rating}
        </span>
        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
          ({reviewCount.toLocaleString()})
        </span>
      </div>

      {/* DELIVERY TIME & STOCK */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          <span>⏱</span> 22 mins
        </span>
        {activeVariant.stockCount > 0 && activeVariant.stockCount <= 5 && (
          <span style={{ color: '#ef4444', fontWeight: 700 }}>
            {activeVariant.stockCount} left
          </span>
        )}
      </div>
    </div>
  );
}

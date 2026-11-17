/**
 * categoryThumbnailMap.js
 * 
 * Provides curated category suggestions, high-resolution thumbnail mappings,
 * and text formatting for visual autocomplete matching the reference UI.
 */

export const CURATED_CATEGORY_THUMBNAILS = {
  // Powder specific mappings matching UI reference image
  'powder': 'https://res.cloudinary.com/dj48tkcsw/image/upload/v1775368062/Products/Amul/kp5mli0uneidjzg4ytmm.webp',
  'face powder': 'https://res.cloudinary.com/dj48tkcsw/image/upload/v1775374531/Products/Amul/tdxtg1ocwgcqiqzterj9.avif',
  'talcum powder': 'https://res.cloudinary.com/dj48tkcsw/image/upload/v1775368062/Products/Amul/kp5mli0uneidjzg4ytmm.webp',
  'detergent powder': 'https://res.cloudinary.com/dj48tkcsw/image/upload/v1775368144/Products/Amul/jaeiv0fjtlq2utwnk0cq.webp',
  'himalaya baby powder': 'https://res.cloudinary.com/dj48tkcsw/image/upload/v1775368302/Products/Amul/pke0syf0hs9bfqbqakja.webp',
  'baby powder': 'https://res.cloudinary.com/dj48tkcsw/image/upload/v1775368302/Products/Amul/pke0syf0hs9bfqbqakja.webp',

  // Grocery & Staples
  'rice': 'https://res.cloudinary.com/dj48tkcsw/image/upload/v1782202730/packitout/categories/Atta___Rice.png',
  'chawal': 'https://res.cloudinary.com/dj48tkcsw/image/upload/v1782202730/packitout/categories/Atta___Rice.png',
  'basmati rice': 'https://res.cloudinary.com/dj48tkcsw/image/upload/v1782202730/packitout/categories/Atta___Rice.png',
  'kolam rice': 'https://res.cloudinary.com/dj48tkcsw/image/upload/v1782202730/packitout/categories/Atta___Rice.png',
  'brown rice': 'https://res.cloudinary.com/dj48tkcsw/image/upload/v1782202730/packitout/categories/Atta___Rice.png',
  'idli rice': 'https://res.cloudinary.com/dj48tkcsw/image/upload/v1782202730/packitout/categories/Atta___Rice.png',
  'atta': 'https://res.cloudinary.com/dj48tkcsw/image/upload/v1782202730/packitout/categories/Atta___Rice.png',
  'wheat flour': 'https://res.cloudinary.com/dj48tkcsw/image/upload/v1782202730/packitout/categories/Atta___Rice.png',
  'kaju': 'https://res.cloudinary.com/dj48tkcsw/image/upload/v1782202758/packitout/categories/Dry_Fruits___Cereals.png',
  'cashew': 'https://res.cloudinary.com/dj48tkcsw/image/upload/v1782202758/packitout/categories/Dry_Fruits___Cereals.png',
  'cashews': 'https://res.cloudinary.com/dj48tkcsw/image/upload/v1782202758/packitout/categories/Dry_Fruits___Cereals.png',
  'dry fruits': 'https://res.cloudinary.com/dj48tkcsw/image/upload/v1782202758/packitout/categories/Dry_Fruits___Cereals.png',
  'badam': 'https://res.cloudinary.com/dj48tkcsw/image/upload/v1782202758/packitout/categories/Dry_Fruits___Cereals.png',
  'almonds': 'https://res.cloudinary.com/dj48tkcsw/image/upload/v1782202758/packitout/categories/Dry_Fruits___Cereals.png',
  'dals': 'https://res.cloudinary.com/dj48tkcsw/image/upload/v1782202832/packitout/categories/Dals___Pulses.png',
  'oil': 'https://res.cloudinary.com/dj48tkcsw/image/upload/v1782202857/packitout/categories/Oil__Ghee___Salt.png',
  'tel': 'https://res.cloudinary.com/dj48tkcsw/image/upload/v1782202857/packitout/categories/Oil__Ghee___Salt.png',
  'sugar': 'https://res.cloudinary.com/dj48tkcsw/image/upload/v1782202857/packitout/categories/Oil__Ghee___Salt.png',
  'chini': 'https://res.cloudinary.com/dj48tkcsw/image/upload/v1782202857/packitout/categories/Oil__Ghee___Salt.png',
  'haldi': 'https://res.cloudinary.com/dj48tkcsw/image/upload/v1782202816/packitout/categories/Spices___condiments.png',
  'turmeric': 'https://res.cloudinary.com/dj48tkcsw/image/upload/v1782202816/packitout/categories/Spices___condiments.png',

  // Dairy & Breakfast
  'milk': 'https://res.cloudinary.com/dj48tkcsw/image/upload/v1782202789/packitout/categories/Dairy__Bread___Eggs.png',
  'toned milk': 'https://res.cloudinary.com/dj48tkcsw/image/upload/v1782202789/packitout/categories/Dairy__Bread___Eggs.png',
  'bread': 'https://res.cloudinary.com/dj48tkcsw/image/upload/v1782202789/packitout/categories/Dairy__Bread___Eggs.png',
  'butter': 'https://res.cloudinary.com/dj48tkcsw/image/upload/v1782202789/packitout/categories/Dairy__Bread___Eggs.png',
  'cereals': 'https://res.cloudinary.com/dj48tkcsw/image/upload/v1779880955/packitout/categories/Breakfast_cereals.png',

  // Personal Care & Soaps
  'soap': 'https://res.cloudinary.com/dj48tkcsw/image/upload/v1782202739/packitout/categories/Bath___Body.png',
  'soaps': 'https://res.cloudinary.com/dj48tkcsw/image/upload/v1782202739/packitout/categories/Bath___Body.png',
  'bath soap': 'https://res.cloudinary.com/dj48tkcsw/image/upload/v1782202739/packitout/categories/Bath___Body.png',
  'shampoo': 'https://res.cloudinary.com/dj48tkcsw/image/upload/v1782202745/packitout/categories/Beauty___Grooming.png',
  'beauty': 'https://res.cloudinary.com/dj48tkcsw/image/upload/v1782202745/packitout/categories/Beauty___Grooming.png',

  // Snacks & Beverages
  'tea': 'https://res.cloudinary.com/dj48tkcsw/image/upload/v1779887235/packitout/categories/Tea_Coffee.png',
  'coffee': 'https://res.cloudinary.com/dj48tkcsw/image/upload/v1779887235/packitout/categories/Tea_Coffee.png',
  'chips': 'https://res.cloudinary.com/dj48tkcsw/image/upload/v1779880970/packitout/categories/chips_Namkeen.png',
  'chocolates': 'https://res.cloudinary.com/dj48tkcsw/image/upload/v1779881154/packitout/categories/Sweets_Chocolates.png',
  'cold drinks': 'https://res.cloudinary.com/dj48tkcsw/image/upload/v1779880979/packitout/categories/Drinks_Juices.png',
  'maggi': 'https://res.cloudinary.com/dj48tkcsw/image/upload/v1779881027/packitout/categories/Instant_Food.png',

  // Default fallback
  'default': 'https://res.cloudinary.com/dj48tkcsw/image/upload/v1775368062/Products/Amul/kp5mli0uneidjzg4ytmm.webp'
};

/**
 * Resolves a thumbnail URL for any query term, category, or product.
 */
export function resolveCategoryThumbnail(text, fallbackImage = null) {
  if (fallbackImage && typeof fallbackImage === 'string' && fallbackImage.startsWith('http')) {
    return fallbackImage;
  }
  const str = String(text || '').toLowerCase().trim();
  for (const [key, url] of Object.entries(CURATED_CATEGORY_THUMBNAILS)) {
    if (str.includes(key)) return url;
  }
  return CURATED_CATEGORY_THUMBNAILS.default;
}

/**
 * Curated suggestions for top categories when user types specific keywords.
 * Specifically structured to match the UI reference image for "powder" and other queries.
 */
const CURATED_SUGGESTION_PACKS = {
  powder: [
    {
      id: 'cat_powder',
      text: 'Powder',
      category: 'Beauty & Grooming',
      subCategory: 'Deodorants & Fragrances',
      type: 'category',
      thumbnail: CURATED_CATEGORY_THUMBNAILS['powder'],
    },
    {
      id: 'type_face_powder',
      text: 'Face powder',
      category: 'Beauty & Grooming',
      subCategory: 'Makeup & Cosmetics',
      type: 'subCategory',
      thumbnail: CURATED_CATEGORY_THUMBNAILS['face powder'],
    },
    {
      id: 'type_talcum_powder',
      text: 'Talcum powder',
      category: 'Beauty & Grooming',
      subCategory: 'Deodorants & Fragrances',
      type: 'subCategory',
      thumbnail: CURATED_CATEGORY_THUMBNAILS['talcum powder'],
    },
    {
      id: 'type_detergent_powder',
      text: 'Detergent powder',
      category: 'Cleaners & Repellents',
      subCategory: 'Laundry Detergents',
      type: 'subCategory',
      thumbnail: CURATED_CATEGORY_THUMBNAILS['detergent powder'],
    },
    {
      id: 'brand_himalaya_baby_powder',
      text: 'Himalaya baby powder',
      category: 'Baby Care',
      subCategory: 'Baby Powder & Creams',
      brand: 'Himalaya',
      type: 'brand_item',
      thumbnail: CURATED_CATEGORY_THUMBNAILS['himalaya baby powder'],
    },
  ],
  rice: [
    {
      id: 'cat_rice',
      text: 'Rice',
      category: 'Atta & Rice',
      subCategory: 'Rice & Grains',
      type: 'category',
      thumbnail: CURATED_CATEGORY_THUMBNAILS['rice'],
    },
    {
      id: 'type_basmati_rice',
      text: 'Basmati rice',
      category: 'Atta & Rice',
      subCategory: 'Basmati Rice',
      type: 'subCategory',
      thumbnail: CURATED_CATEGORY_THUMBNAILS['basmati rice'],
    },
    {
      id: 'type_kolam_rice',
      text: 'Kolam rice',
      category: 'Atta & Rice',
      subCategory: 'Daily Rice',
      type: 'subCategory',
      thumbnail: CURATED_CATEGORY_THUMBNAILS['kolam rice'],
    },
    {
      id: 'type_brown_rice',
      text: 'Brown rice',
      category: 'Atta & Rice',
      subCategory: 'Healthy Grains',
      type: 'subCategory',
      thumbnail: CURATED_CATEGORY_THUMBNAILS['brown rice'],
    },
    {
      id: 'type_idli_rice',
      text: 'Idli rice',
      category: 'Atta & Rice',
      subCategory: 'Specialty Rice',
      type: 'subCategory',
      thumbnail: CURATED_CATEGORY_THUMBNAILS['idli rice'],
    },
  ],
  milk: [
    {
      id: 'cat_milk',
      text: 'Milk',
      category: 'Dairy, Bread & Eggs',
      subCategory: 'Fresh Milk',
      type: 'category',
      thumbnail: CURATED_CATEGORY_THUMBNAILS['milk'],
    },
    {
      id: 'type_toned_milk',
      text: 'Toned milk',
      category: 'Dairy, Bread & Eggs',
      subCategory: 'Toned Milk',
      type: 'subCategory',
      thumbnail: CURATED_CATEGORY_THUMBNAILS['toned milk'],
    },
    {
      id: 'type_full_cream_milk',
      text: 'Full cream milk',
      category: 'Dairy, Bread & Eggs',
      subCategory: 'Full Cream Milk',
      type: 'subCategory',
      thumbnail: CURATED_CATEGORY_THUMBNAILS['milk'],
    },
    {
      id: 'type_cow_milk',
      text: 'Cow milk',
      category: 'Dairy, Bread & Eggs',
      subCategory: 'Cow Milk',
      type: 'subCategory',
      thumbnail: CURATED_CATEGORY_THUMBNAILS['milk'],
    },
  ],
  soap: [
    {
      id: 'cat_soap',
      text: 'Soap',
      category: 'Bath & Body',
      subCategory: 'Bath Soaps',
      type: 'category',
      thumbnail: CURATED_CATEGORY_THUMBNAILS['soap'],
    },
    {
      id: 'type_bath_soap',
      text: 'Bath soap',
      category: 'Bath & Body',
      subCategory: 'Bath Soaps',
      type: 'subCategory',
      thumbnail: CURATED_CATEGORY_THUMBNAILS['bath soap'],
    },
    {
      id: 'type_baby_soap',
      text: 'Baby soap',
      category: 'Baby Care',
      subCategory: 'Baby Soaps',
      type: 'subCategory',
      thumbnail: CURATED_CATEGORY_THUMBNAILS['baby powder'],
    },
    {
      id: 'type_dishwash_soap',
      text: 'Dishwash soap',
      category: 'Cleaners & Repellents',
      subCategory: 'Dishwashing',
      type: 'subCategory',
      thumbnail: CURATED_CATEGORY_THUMBNAILS['detergent powder'],
    },
  ],
  kaju: [
    {
      id: 'cat_kaju',
      text: 'Kaju (Cashews)',
      category: 'Dry Fruits & Cereals',
      subCategory: 'Dry Fruits, Nuts & Seeds',
      type: 'category',
      thumbnail: CURATED_CATEGORY_THUMBNAILS['kaju'],
    },
    {
      id: 'type_whole_cashews',
      text: 'Whole Cashews W320 / W240',
      category: 'Dry Fruits & Cereals',
      subCategory: 'Dry Fruits, Nuts & Seeds',
      type: 'subCategory',
      thumbnail: CURATED_CATEGORY_THUMBNAILS['cashew'],
    },
    {
      id: 'type_roasted_kaju',
      text: 'Roasted & Salted Kaju',
      category: 'Dry Fruits & Cereals',
      subCategory: 'Dry Fruits, Nuts & Seeds',
      type: 'subCategory',
      thumbnail: CURATED_CATEGORY_THUMBNAILS['kaju'],
    },
    {
      id: 'type_kaju_tukda',
      text: 'Kaju Tukda (Broken Cashews)',
      category: 'Dry Fruits & Cereals',
      subCategory: 'Dry Fruits, Nuts & Seeds',
      type: 'subCategory',
      thumbnail: CURATED_CATEGORY_THUMBNAILS['kaju'],
    },
  ],
  cashew: [
    {
      id: 'cat_cashew',
      text: 'Cashew (Kaju)',
      category: 'Dry Fruits & Cereals',
      subCategory: 'Dry Fruits, Nuts & Seeds',
      type: 'category',
      thumbnail: CURATED_CATEGORY_THUMBNAILS['cashew'],
    },
    {
      id: 'type_whole_cashews_en',
      text: 'Whole Cashew Nuts',
      category: 'Dry Fruits & Cereals',
      subCategory: 'Dry Fruits, Nuts & Seeds',
      type: 'subCategory',
      thumbnail: CURATED_CATEGORY_THUMBNAILS['cashews'],
    },
  ],
  chawal: [
    {
      id: 'cat_chawal',
      text: 'Chawal (Rice)',
      category: 'Atta & Rice',
      subCategory: 'Rice & Grains',
      type: 'category',
      thumbnail: CURATED_CATEGORY_THUMBNAILS['rice'],
    },
    {
      id: 'type_basmati_chawal',
      text: 'Basmati Chawal',
      category: 'Atta & Rice',
      subCategory: 'Basmati Rice',
      type: 'subCategory',
      thumbnail: CURATED_CATEGORY_THUMBNAILS['basmati rice'],
    },
  ],
};

/**
 * Generates category/type visual autocomplete suggestions.
 * Prioritizes curated packs (matching reference UI), then expands with dynamic catalog items.
 * 
 * @param {string} query 
 * @param {Array} catalogItems 
 * @param {number} limit 
 * @returns {Array<{ id: string, text: string, category: string, subCategory?: string, brand?: string, type: string, thumbnail: string }>}
 */
export function getVisualSuggestions(query, catalogItems = [], limit = 6) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return [];

  const results = [];
  const seenTexts = new Set();

  // 1. Check curated suggestion packs
  for (const [key, pack] of Object.entries(CURATED_SUGGESTION_PACKS)) {
    if (q === key || key.startsWith(q) || q.startsWith(key)) {
      for (const item of pack) {
        if (!seenTexts.has(item.text.toLowerCase())) {
          seenTexts.add(item.text.toLowerCase());
          results.push(item);
        }
      }
    }
  }

  // 2. Discover suggestions from live catalog items
  if (Array.isArray(catalogItems) && catalogItems.length > 0) {
    for (const item of catalogItems) {
      if (results.length >= limit * 2) break;
      const cat = item.category;
      const sub = item.subCategory;
      const brand = item.brand;
      const name = item.name || '';

      // Check subCategory
      if (sub && sub.toLowerCase().includes(q) && !seenTexts.has(sub.toLowerCase())) {
        seenTexts.add(sub.toLowerCase());
        results.push({
          id: `sub_${sub.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          text: sub,
          category: cat || '',
          subCategory: sub,
          type: 'subCategory',
          thumbnail: resolveCategoryThumbnail(sub, item.image),
        });
      }

      // Check category
      if (cat && cat.toLowerCase().includes(q) && !seenTexts.has(cat.toLowerCase())) {
        seenTexts.add(cat.toLowerCase());
        results.push({
          id: `cat_${cat.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          text: cat,
          category: cat,
          type: 'category',
          thumbnail: resolveCategoryThumbnail(cat, item.image),
        });
      }

      // Check brand + query
      if (brand && name.toLowerCase().includes(brand.toLowerCase()) && name.toLowerCase().includes(q)) {
        const brandItem = `${brand} ${q}`.trim().replace(/\b\w/g, c => c.toUpperCase());
        if (!seenTexts.has(brandItem.toLowerCase())) {
          seenTexts.add(brandItem.toLowerCase());
          results.push({
            id: `brand_item_${brandItem.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
            text: brandItem,
            category: cat || '',
            brand: brand,
            type: 'brand_item',
            thumbnail: resolveCategoryThumbnail(brandItem, item.image),
          });
        }
      }
    }
  }

  return results.slice(0, limit);
}

/**
 * Formats suggestion text to match UI reference image:
 * e.g. for text "Face powder" and query "powder":
 *  boldPart: "Face "
 *  normalPart: "powder"
 * 
 * e.g. for text "Talcum powder" and query "powder":
 *  boldPart: "Talcum "
 *  normalPart: "powder"
 * 
 * e.g. for text "Powder" and query "powder":
 *  boldPart: ""
 *  normalPart: "Powder"
 */
export function formatSuggestionText(suggestionText, query) {
  const full = String(suggestionText || '').trim();
  const q = String(query || '').trim();
  if (!full) return { boldPart: '', normalPart: '' };
  if (!q) return { boldPart: '', normalPart: full };

  const fullLower = full.toLowerCase();
  const qLower = q.toLowerCase();

  // If text ends with query (e.g. "Face powder" ending with "powder")
  // The prefix differentiator is bold, and the matching query suffix is normal/muted
  if (fullLower.endsWith(qLower) && fullLower.length > qLower.length) {
    const splitIndex = full.length - q.length;
    return {
      boldPart: full.slice(0, splitIndex),
      normalPart: full.slice(splitIndex),
      mode: 'prefix_bold'
    };
  }

  // If text starts with query (e.g. "Powder Puff" starting with "Powder")
  if (fullLower.startsWith(qLower) && fullLower.length > qLower.length) {
    return {
      boldPart: full.slice(q.length),
      normalPart: full.slice(0, q.length),
      mode: 'suffix_bold'
    };
  }

  // Exact match
  if (fullLower === qLower) {
    return {
      boldPart: '',
      normalPart: full,
      mode: 'exact'
    };
  }

  // General substring match
  const idx = fullLower.indexOf(qLower);
  if (idx !== -1) {
    return {
      boldPart: full.slice(0, idx),
      normalPart: full.slice(idx, idx + q.length),
      afterPart: full.slice(idx + q.length),
      mode: 'substring'
    };
  }

  return { boldPart: '', normalPart: full, mode: 'plain' };
}

export default {
  CURATED_CATEGORY_THUMBNAILS,
  resolveCategoryThumbnail,
  getVisualSuggestions,
  formatSuggestionText,
};

/**
 * dynamicFilterExtractor.js
 * 
 * Dynamic attribute inference and context-aware facet aggregation for client-side
 * and hybrid search. Derives category-specific filter options (e.g. Gender & Brand
 * for powder/cosmetics; Price per kg & Brand for grocery/rice), price range bounds,
 * and standard sort options. Also provides fast filtering and sorting execution.
 */

import { calculateUnitPrice } from './unitPriceHelper.js';

export const SORT_OPTIONS = [
  { id: 'relevance', label: 'Relevance' },
  { id: 'price_asc', label: 'Price: Low to High' },
  { id: 'price_desc', label: 'Price: High to Low' },
  { id: 'discount_desc', label: 'Discount: High to Low' },
  { id: 'rating_desc', label: 'Customer Rating' }
];

/**
 * Infer item attributes based on name, category, subCategory, searchTags, description, etc.
 * Resilient regex heuristics matching backend inferProductAttributes contract.
 */
export function inferProductAttributes(product) {
  if (!product) return {};

  const attrs = {};
  const tagsStr = Array.isArray(product.searchTags)
    ? product.searchTags.join(' ')
    : String(product.searchTags || '');
  const rawText = `${product.name || ''} ${product.subCategory || ''} ${product.category || ''} ${tagsStr} ${product.description || ''}`;
  const text = rawText.toLowerCase();

  // 1. Gender Inference (cosmetics, powders, perfumes, personal care, baby care)
  const isPersonalCareOrBeauty =
    /beauty|grooming|personal care|cosmetic|fragrance|deodorant|perfume|powder|talc|soap|shampoo|skincare|skin|hair|lotion/i.test(text);

  const hasBabyCue = /\b(baby|infant|newborn|toddler|kinder)\b/i.test(text);
  const hasWomenCue = /\b(women|woman|ladies|female|girls?)\b/i.test(text);
  const hasMenCue = /\b(men|man|gentlemen|male|boys?)\b/i.test(text);
  const hasUnisexCue = /\b(unisex|all skin types|for all|men and women|women and men)\b/i.test(text);

  if (hasBabyCue) {
    attrs.gender = 'Baby';
  } else if (hasUnisexCue) {
    attrs.gender = 'Unisex';
  } else if (hasWomenCue && !hasMenCue) {
    attrs.gender = 'Women';
  } else if (hasMenCue && !hasWomenCue) {
    attrs.gender = 'Men';
  } else if (hasWomenCue && hasMenCue) {
    attrs.gender = 'Unisex';
  } else if (isPersonalCareOrBeauty && /powder|talc|perfume|deodorant|fragrance/i.test(text)) {
    // Default personal care powder without explicit gender cues to Unisex
    attrs.gender = 'Unisex';
  }

  // 2. Grain Type Inference (for Rice, Atta, Staples)
  const isGrainOrStaple = /rice|atta|wheat|flour|dal|pulse|grain/i.test(text);
  if (isGrainOrStaple) {
    if (/\bbasmati\b/i.test(text)) {
      attrs.grainType = 'Basmati';
    } else if (/\bbrown rice\b/i.test(text)) {
      attrs.grainType = 'Brown Rice';
    } else if (/\b(kolam|sona masoori|sonamasuri|daily rice|raw rice|boiled rice|ponni|idli rice|broken rice|jeera rice|gobindobhog|wada kolam)\b/i.test(text)) {
      attrs.grainType = 'Daily Rice';
    } else if (/rice/i.test(text)) {
      attrs.grainType = 'Daily Rice';
    }
  }

  // 3. Dietary Inference (Veg / Non-Veg)
  if (product.isVeg !== undefined && product.isVeg !== null) {
    attrs.dietary = product.isVeg ? 'Vegetarian' : 'Non-Vegetarian';
  } else if (/egg|chicken|mutton|fish|meat/i.test(text)) {
    attrs.dietary = 'Non-Vegetarian';
  } else {
    attrs.dietary = 'Vegetarian';
  }

  // 4. Normalized Brand
  let cleanBrand = (product.brand || '').trim();
  if (cleanBrand && cleanBrand.toLowerCase() !== 'nan' && cleanBrand.toLowerCase() !== 'undefined') {
    attrs.brand = cleanBrand;
  }

  // 5. Unit Price Range classification
  const price = Number(product.sellingPrice !== undefined ? product.sellingPrice : (product.mrp || 0));
  const qnty = product.qnty || product.quantity;
  if (price > 0 && qnty) {
    const unitPriceInfo = calculateUnitPrice(price, qnty);
    if (unitPriceInfo) {
      attrs.unitMeasure = unitPriceInfo.unitMeasure;
      attrs.unitPrice = unitPriceInfo.unitPrice;
      attrs.unitPriceDisplay = unitPriceInfo.display;

      if (unitPriceInfo.unitMeasure === 'kg') {
        const p = unitPriceInfo.unitPrice;
        if (p < 50) attrs.pricePerUnitRange = 'under_50';
        else if (p <= 100) attrs.pricePerUnitRange = '50_100';
        else if (p <= 150) attrs.pricePerUnitRange = '100_150';
        else attrs.pricePerUnitRange = '150_plus';
      } else if (unitPriceInfo.unitMeasure === '100 g') {
        const p = unitPriceInfo.unitPrice;
        if (p < 50) attrs.pricePerUnitRange = 'under_50';
        else if (p <= 100) attrs.pricePerUnitRange = '50_100';
        else attrs.pricePerUnitRange = '100_plus';
      }
    }
  }

  return attrs;
}

/**
 * Extracts available dynamic filter pills and price bounds from an array of products.
 * Adapts dynamically to query and active category.
 */
export function extractDynamicFilters(products = [], query = '', activeCategory = '') {
  const qLower = String(query || '').toLowerCase().trim();
  const catLower = String(activeCategory || '').toLowerCase().trim();

  let minPrice = Infinity;
  let maxPrice = 0;

  const genderCounts = { Women: 0, Men: 0, Baby: 0, Unisex: 0 };
  const grainTypeCounts = { Basmati: 0, 'Daily Rice': 0, 'Brown Rice': 0 };
  const brandCounts = new Map();
  const priceKgCounts = {
    'under_50': { label: 'Under ₹50/kg', count: 0 },
    '50_100': { label: '₹50 - ₹100/kg', count: 0 },
    '100_150': { label: '₹100 - ₹150/kg', count: 0 },
    '150_plus': { label: 'Above ₹150/kg', count: 0 }
  };
  const price100gCounts = {
    'under_50': { label: 'Under ₹50/100g', count: 0 },
    '50_100': { label: '₹50 - ₹100/100g', count: 0 },
    '100_plus': { label: 'Above ₹100/100g', count: 0 }
  };

  let hasGender = false;
  let hasGrainType = false;
  let kgProductCount = 0;
  let g100ProductCount = 0;

  for (const item of products) {
    const price = Number(item.sellingPrice !== undefined ? item.sellingPrice : (item.mrp || 0));
    if (price > 0) {
      if (price < minPrice) minPrice = price;
      if (price > maxPrice) maxPrice = price;
    }

    const attrs = item.attributes || inferProductAttributes(item);

    // Gender counts
    if (attrs.gender && genderCounts[attrs.gender] !== undefined) {
      genderCounts[attrs.gender]++;
      hasGender = true;
    }

    // Grain type counts
    if (attrs.grainType && grainTypeCounts[attrs.grainType] !== undefined) {
      grainTypeCounts[attrs.grainType]++;
      hasGrainType = true;
    }

    // Brand counts
    const brand = attrs.brand || item.brand;
    if (brand && String(brand).toLowerCase() !== 'nan') {
      const bKey = String(brand).trim();
      brandCounts.set(bKey, (brandCounts.get(bKey) || 0) + 1);
    }

    // Unit price ranges
    const unitMeasure = attrs.unitMeasure || item.unitMeasure;
    const unitPrice = attrs.unitPrice !== undefined ? attrs.unitPrice : item.unitPrice;
    if (unitMeasure === 'kg' && unitPrice !== undefined) {
      kgProductCount++;
      if (unitPrice < 50) priceKgCounts['under_50'].count++;
      else if (unitPrice <= 100) priceKgCounts['50_100'].count++;
      else if (unitPrice <= 150) priceKgCounts['100_150'].count++;
      else priceKgCounts['150_plus'].count++;
    } else if (unitMeasure === '100 g' && unitPrice !== undefined) {
      g100ProductCount++;
      if (unitPrice < 50) price100gCounts['under_50'].count++;
      else if (unitPrice <= 100) price100gCounts['50_100'].count++;
      else price100gCounts['100_plus'].count++;
    }
  }

  // Construct dynamic filter pills
  const filterPills = [];

  const isCosmeticOrPowderContext =
    qLower.includes('powder') ||
    qLower.includes('cream') ||
    qLower.includes('soap') ||
    qLower.includes('shampoo') ||
    catLower.includes('beauty') ||
    catLower.includes('grooming') ||
    hasGender;

  const isRiceOrGrainContext =
    qLower.includes('rice') ||
    qLower.includes('atta') ||
    catLower.includes('atta') ||
    catLower.includes('rice') ||
    hasGrainType;

  // 1. Gender Filter Pill (Dynamic: appears for powder / cosmetics / personal care)
  if (isCosmeticOrPowderContext || hasGender) {
    const genderOptions = [
      { value: 'Women', label: 'Women', count: genderCounts.Women },
      { value: 'Men', label: 'Men', count: genderCounts.Men },
      { value: 'Baby', label: 'Baby', count: genderCounts.Baby },
      { value: 'Unisex', label: 'Unisex', count: genderCounts.Unisex },
    ].filter(o => o.count > 0);

    if (genderOptions.length > 0) {
      filterPills.push({
        key: 'gender',
        label: 'Gender',
        type: 'single_select',
        priority: 1,
        options: genderOptions
      });
    }
  }

  // 2. Grain Type Pill (Dynamic: appears for rice/atta/grocery)
  if (isRiceOrGrainContext || hasGrainType) {
    const grainOptions = [
      { value: 'Basmati', label: 'Basmati', count: grainTypeCounts.Basmati },
      { value: 'Daily Rice', label: 'Daily Rice', count: grainTypeCounts['Daily Rice'] },
      { value: 'Brown Rice', label: 'Brown Rice', count: grainTypeCounts['Brown Rice'] },
    ].filter(o => o.count > 0);

    if (grainOptions.length > 0) {
      filterPills.push({
        key: 'grainType',
        label: 'Grain Type',
        type: 'single_select',
        priority: 1,
        options: grainOptions
      });
    }
  }

  // 3. Brand Pill (Available across all queries with brands)
  if (brandCounts.size > 0) {
    const sortedBrands = Array.from(brandCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([brand, count]) => ({ value: brand, label: brand, count }));

    filterPills.push({
      key: 'brand',
      label: 'Brand',
      type: 'multi_select',
      priority: 2,
      options: sortedBrands
    });
  }

  // 4. Price Per Unit Pill (Dynamic: Price per kg for rice/staples, or Price per 100g for powders)
  if (isRiceOrGrainContext && kgProductCount > 0) {
    const kgOptions = Object.entries(priceKgCounts)
      .filter(([_, opt]) => opt.count > 0)
      .map(([key, opt]) => ({ value: key, label: opt.label, count: opt.count }));

    if (kgOptions.length > 0) {
      filterPills.push({
        key: 'pricePerUnit',
        label: 'Price per kg',
        type: 'single_select',
        priority: 3,
        options: kgOptions
      });
    }
  } else if (isCosmeticOrPowderContext && g100ProductCount > 0) {
    const gOptions = Object.entries(price100gCounts)
      .filter(([_, opt]) => opt.count > 0)
      .map(([key, opt]) => ({ value: key, label: opt.label, count: opt.count }));

    if (gOptions.length > 0) {
      filterPills.push({
        key: 'pricePerUnit',
        label: 'Price per 100g',
        type: 'single_select',
        priority: 3,
        options: gOptions
      });
    }
  }

  return {
    query: query || '',
    category: activeCategory || '',
    sortOptions: SORT_OPTIONS,
    priceRange: {
      min: minPrice === Infinity ? 0 : minPrice,
      max: maxPrice === 0 ? 500 : maxPrice
    },
    filterPills
  };
}

/**
 * Filters and sorts items based on active selections.
 * 
 * @param {Array<object>} items 
 * @param {object} filters - { gender, grainType, brand, minPrice, maxPrice, pricePerUnit, category, subCategory }
 * @param {string} sortBy - 'relevance' | 'price_asc' | 'price_desc' | 'discount_desc' | 'rating_desc'
 * @returns {Array<object>} Filtered and sorted products
 */
export function applyFiltersAndSort(items = [], filters = {}, sortBy = 'relevance') {
  if (!Array.isArray(items)) return [];

  let filtered = items.filter(item => {
    if (!item) return false;
    const attrs = item.attributes || inferProductAttributes(item);
    const price = Number(item.sellingPrice !== undefined ? item.sellingPrice : (item.mrp || 0));

    // Category filter
    if (filters.category) {
      const cat = String(item.category || '').toLowerCase();
      if (!cat.includes(String(filters.category).toLowerCase())) return false;
    }

    // SubCategory filter
    if (filters.subCategory) {
      const sub = String(item.subCategory || '').toLowerCase();
      if (!sub.includes(String(filters.subCategory).toLowerCase())) return false;
    }

    // Gender filter (single or multi)
    if (filters.gender) {
      const activeGenders = Array.isArray(filters.gender) ? filters.gender : [filters.gender];
      if (activeGenders.length > 0 && !activeGenders.includes(attrs.gender)) {
        return false;
      }
    }

    // Grain Type filter
    if (filters.grainType) {
      const activeGrains = Array.isArray(filters.grainType) ? filters.grainType : [filters.grainType];
      if (activeGrains.length > 0 && !activeGrains.includes(attrs.grainType)) {
        return false;
      }
    }

    // Brand filter (multi-select)
    if (filters.brand) {
      const activeBrands = Array.isArray(filters.brand) ? filters.brand : [filters.brand];
      if (activeBrands.length > 0) {
        const itemBrand = String(attrs.brand || item.brand || '').trim();
        const matchesBrand = activeBrands.some(b => itemBrand.toLowerCase() === String(b).trim().toLowerCase());
        if (!matchesBrand) return false;
      }
    }

    // Min Price
    if (filters.minPrice !== undefined && filters.minPrice !== null && filters.minPrice !== '') {
      if (price < Number(filters.minPrice)) return false;
    }

    // Max Price
    if (filters.maxPrice !== undefined && filters.maxPrice !== null && filters.maxPrice !== '') {
      if (price > Number(filters.maxPrice)) return false;
    }

    // Price Per Unit tier (e.g. 'under_50', '50_100', '100_150', '150_plus')
    if (filters.pricePerUnit) {
      const unitPrice = attrs.unitPrice !== undefined ? attrs.unitPrice : item.unitPrice;
      if (unitPrice === undefined) return false;
      switch (filters.pricePerUnit) {
        case 'under_50':
          if (unitPrice >= 50) return false;
          break;
        case '50_100':
          if (unitPrice < 50 || unitPrice > 100) return false;
          break;
        case '100_150':
          if (unitPrice < 100 || unitPrice > 150) return false;
          break;
        case '150_plus':
        case '100_plus':
          if (filters.pricePerUnit === '150_plus' && unitPrice < 150) return false;
          if (filters.pricePerUnit === '100_plus' && unitPrice < 100) return false;
          break;
        default:
          break;
      }
    }

    return true;
  });

  // Apply Sorting
  const sorted = [...filtered];
  switch (sortBy) {
    case 'price_asc':
      sorted.sort((a, b) => {
        const pa = Number(a.sellingPrice !== undefined ? a.sellingPrice : (a.mrp || 0));
        const pb = Number(b.sellingPrice !== undefined ? b.sellingPrice : (b.mrp || 0));
        return pa - pb;
      });
      break;

    case 'price_desc':
      sorted.sort((a, b) => {
        const pa = Number(a.sellingPrice !== undefined ? a.sellingPrice : (a.mrp || 0));
        const pb = Number(b.sellingPrice !== undefined ? b.sellingPrice : (b.mrp || 0));
        return pb - pa;
      });
      break;

    case 'discount_desc':
      sorted.sort((a, b) => {
        const da = getDiscountPercent(a);
        const db = getDiscountPercent(b);
        return db - da;
      });
      break;

    case 'rating_desc':
      sorted.sort((a, b) => {
        const ra = Number(a.rating || a.averageRating || 4.2);
        const rb = Number(b.rating || b.averageRating || 4.2);
        return rb - ra;
      });
      break;

    case 'relevance':
    default:
      // Keep natural relevance / ranking order
      break;
  }

  return sorted;
}

/**
 * Calculates discount percent for an item.
 */
export function getDiscountPercent(item) {
  if (!item) return 0;
  if (item.discountPercent !== undefined && item.discountPercent !== null) {
    return Number(item.discountPercent);
  }
  const mrp = Number(item.mrp || 0);
  const sell = Number(item.sellingPrice !== undefined ? item.sellingPrice : mrp);
  if (mrp > 0 && sell < mrp) {
    return Math.round(((mrp - sell) / mrp) * 100);
  }
  return 0;
}

export default {
  SORT_OPTIONS,
  inferProductAttributes,
  extractDynamicFilters,
  applyFiltersAndSort,
  getDiscountPercent,
};

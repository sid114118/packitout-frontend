/**
 * unitPriceHelper.js
 * 
 * Provides robust quantity parsing and standardized unit price calculation
 * for grocery & quick-commerce catalogs (matching Zepto/Blinkit UI reference standards).
 * 
 * Examples:
 *  - 125 g at ₹148  ->  ₹118/100 g
 *  - 100 g at ₹140  ->  ₹140/100 g
 *  - 1 kg at ₹171   ->  ₹171/kg
 *  - 500 ml at ₹45  ->  ₹9/100 ml
 *  - 1 L at ₹75     ->  ₹75/L
 *  - 6 pcs at ₹90   ->  ₹15/pc
 */

/**
 * Parse quantity string into numeric value and normalized unit.
 * @param {string|number} qntyStr 
 * @returns {{ value: number, unit: string, category: 'weight'|'volume'|'count'|'other' } | null}
 */
export function parseQuantity(qntyStr) {
  if (!qntyStr && qntyStr !== 0) return null;
  const str = String(qntyStr).trim();
  if (!str) return null;

  // Regex matching number (int or decimal) followed by optional space and unit string
  const regex = /^(\d+(?:\.\d+)?)\s*([a-zA-Z]+(?:\s*[a-zA-Z]+)?)$/;
  const match = str.match(regex);
  if (!match) {
    // Try matching if unit comes within string (e.g., "Pack of 500 g", "500gm")
    const embeddedMatch = str.match(/(\d+(?:\.\d+)?)\s*(kg|kgs|kilo|kilos|kilogram|kilograms|g|gm|gms|gram|grams|mg|l|ltr|ltrs|liter|liters|litre|litres|ml|mils|pcs?|pieces?|units?|tablets?|tabs?|capsules?|packs?|sachets?)/i);
    if (!embeddedMatch) return null;
    return normalizeParsedUnit(parseFloat(embeddedMatch[1]), embeddedMatch[2]);
  }

  const value = parseFloat(match[1]);
  const rawUnit = match[2];
  return normalizeParsedUnit(value, rawUnit);
}

function normalizeParsedUnit(value, rawUnit) {
  if (isNaN(value) || value <= 0) return null;
  const u = rawUnit.toLowerCase().trim();

  // Weight units
  if (['g', 'gm', 'gms', 'gram', 'grams'].includes(u)) {
    return { value, unit: 'g', category: 'weight' };
  }
  if (['kg', 'kgs', 'kilo', 'kilos', 'kilogram', 'kilograms'].includes(u)) {
    return { value, unit: 'kg', category: 'weight' };
  }
  if (['mg', 'milligram', 'milligrams'].includes(u)) {
    return { value, unit: 'mg', category: 'weight' };
  }

  // Volume units
  if (['ml', 'mils', 'milliliter', 'milliliters', 'millilitre', 'millilitres'].includes(u)) {
    return { value, unit: 'ml', category: 'volume' };
  }
  if (['l', 'ltr', 'ltrs', 'liter', 'liters', 'litre', 'litres'].includes(u)) {
    return { value, unit: 'L', category: 'volume' };
  }

  // Count / Piece units
  if (['pc', 'pcs', 'piece', 'pieces', 'unit', 'units', 'item', 'items', 'pack', 'packs', 'sachet', 'sachets', 'tablet', 'tablets', 'tab', 'tabs', 'capsule', 'capsules'].includes(u)) {
    return { value, unit: 'pc', category: 'count' };
  }

  return { value, unit: u, category: 'other' };
}

/**
 * Calculates normalized unit price and returns structured details.
 * 
 * @param {number|string} sellingPrice - Current selling price
 * @param {string|number} qntyStr - Quantity string e.g. "125 g", "1 kg"
 * @returns {{ unitPrice: number, unitMeasure: string, display: string, pricePerKg?: number } | null}
 */
export function calculateUnitPrice(sellingPrice, qntyStr) {
  const price = Number(sellingPrice);
  if (isNaN(price) || price <= 0) return null;

  const parsed = parseQuantity(qntyStr);
  if (!parsed) return null;

  const { value, unit, category } = parsed;

  if (category === 'weight') {
    if (unit === 'kg') {
      const unitPrice = Math.round(price / value);
      const pricePerKg = price / value;
      return {
        unitPrice,
        unitMeasure: 'kg',
        display: `₹${unitPrice}/kg`,
        pricePerKg
      };
    }

    if (unit === 'g') {
      const pricePerKg = (price / value) * 1000;
      if (value < 1000) {
        // Standardize to 100 g for retail pack sizes under 1kg (e.g. 125g @ ₹148 -> ₹118/100 g)
        const unitPrice = Math.round((price / value) * 100);
        return {
          unitPrice,
          unitMeasure: '100 g',
          display: `₹${unitPrice}/100 g`,
          pricePerKg
        };
      } else {
        const unitPrice = Math.round(pricePerKg);
        return {
          unitPrice,
          unitMeasure: 'kg',
          display: `₹${unitPrice}/kg`,
          pricePerKg
        };
      }
    }
  }

  if (category === 'volume') {
    if (unit === 'L') {
      const unitPrice = Math.round(price / value);
      return {
        unitPrice,
        unitMeasure: 'L',
        display: `₹${unitPrice}/L`,
        pricePerL: price / value
      };
    }

    if (unit === 'ml') {
      const pricePerL = (price / value) * 1000;
      if (value < 1000) {
        // Standardize to 100 ml for sizes under 1L
        const unitPrice = Math.round((price / value) * 100);
        return {
          unitPrice,
          unitMeasure: '100 ml',
          display: `₹${unitPrice}/100 ml`,
          pricePerL
        };
      } else {
        const unitPrice = Math.round(pricePerL);
        return {
          unitPrice,
          unitMeasure: 'L',
          display: `₹${unitPrice}/L`,
          pricePerL
        };
      }
    }
  }

  if (category === 'count') {
    if (value > 1) {
      const unitPrice = Math.round(price / value);
      return {
        unitPrice,
        unitMeasure: 'pc',
        display: `₹${unitPrice}/pc`
      };
    }
  }

  return null;
}

/**
 * Returns formatted unit price string e.g. "₹118/100 g" or empty string if not calculable.
 * Accepts either (sellingPrice, qntyStr) or a product object item.
 */
export function formatUnitPrice(arg1, arg2) {
  if (arg1 && typeof arg1 === 'object') {
    // Product object passed
    const item = arg1;
    if (item.unitPriceDisplay) return item.unitPriceDisplay;
    const price = item.sellingPrice !== undefined ? item.sellingPrice : item.mrp;
    const res = calculateUnitPrice(price, item.qnty || item.quantity);
    return res ? res.display : '';
  }

  const res = calculateUnitPrice(arg1, arg2);
  return res ? res.display : '';
}

export default {
  parseQuantity,
  calculateUnitPrice,
  formatUnitPrice,
};

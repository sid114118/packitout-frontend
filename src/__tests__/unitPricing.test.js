import { describe, it, expect } from 'vitest';
import {
  parseQuantity,
  calculateUnitPrice,
  formatUnitPrice,
} from '../utils/unitPriceHelper.js';

describe('Unit Pricing Helper Tests (unitPriceHelper.js)', () => {
  describe('parseQuantity - Tier 1: Happy Path & Canonical Formats', () => {
    it('parses weight in grams (g, gm, gms, grams)', () => {
      expect(parseQuantity('125 g')).toEqual({ value: 125, unit: 'g', category: 'weight' });
      expect(parseQuantity('100g')).toEqual({ value: 100, unit: 'g', category: 'weight' });
      expect(parseQuantity('250 gm')).toEqual({ value: 250, unit: 'g', category: 'weight' });
      expect(parseQuantity('500 grams')).toEqual({ value: 500, unit: 'g', category: 'weight' });
    });

    it('parses weight in kilograms (kg, kgs, kilo, kilogram)', () => {
      expect(parseQuantity('1 kg')).toEqual({ value: 1, unit: 'kg', category: 'weight' });
      expect(parseQuantity('5kg')).toEqual({ value: 5, unit: 'kg', category: 'weight' });
      expect(parseQuantity('2.5 kgs')).toEqual({ value: 2.5, unit: 'kg', category: 'weight' });
      expect(parseQuantity('1 kilogram')).toEqual({ value: 1, unit: 'kg', category: 'weight' });
    });

    it('parses volume in milliliters (ml, mils, milliliter)', () => {
      expect(parseQuantity('500 ml')).toEqual({ value: 500, unit: 'ml', category: 'volume' });
      expect(parseQuantity('200ml')).toEqual({ value: 200, unit: 'ml', category: 'volume' });
      expect(parseQuantity('750 millilitres')).toEqual({ value: 750, unit: 'ml', category: 'volume' });
    });

    it('parses volume in Liters (l, ltr, liters, litre)', () => {
      expect(parseQuantity('1 L')).toEqual({ value: 1, unit: 'L', category: 'volume' });
      expect(parseQuantity('2 ltr')).toEqual({ value: 2, unit: 'L', category: 'volume' });
      expect(parseQuantity('1.5 liters')).toEqual({ value: 1.5, unit: 'L', category: 'volume' });
    });

    it('parses count and piece units (pc, pcs, pieces, pack, tablets)', () => {
      expect(parseQuantity('6 pcs')).toEqual({ value: 6, unit: 'pc', category: 'count' });
      expect(parseQuantity('1 pc')).toEqual({ value: 1, unit: 'pc', category: 'count' });
      expect(parseQuantity('10 tablets')).toEqual({ value: 10, unit: 'pc', category: 'count' });
    });
  });

  describe('parseQuantity - Tier 2: Boundary, Embedded Strings & Edge Cases', () => {
    it('parses embedded and parenthesized strings (e.g. "Pack of 500 g", "1 pack (200 g)")', () => {
      expect(parseQuantity('Pack of 500 g')).toEqual({ value: 500, unit: 'g', category: 'weight' });
      expect(parseQuantity('1 pack (200 g)')).toEqual({ value: 1, unit: 'pc', category: 'count' });
      expect(parseQuantity('Special offer 2 kg')).toEqual({ value: 2, unit: 'kg', category: 'weight' });
      expect(parseQuantity('Box of 10 tablets')).toEqual({ value: 10, unit: 'pc', category: 'count' });
    });

    it('returns null for non-parsable, empty, or invalid inputs', () => {
      expect(parseQuantity(null)).toBeNull();
      expect(parseQuantity(undefined)).toBeNull();
      expect(parseQuantity('')).toBeNull();
      expect(parseQuantity('   ')).toBeNull();
      expect(parseQuantity('no units here')).toBeNull();
      expect(parseQuantity('random text')).toBeNull();
      expect(parseQuantity(0)).toBeNull();
    });
  });

  describe('calculateUnitPrice - Tier 1: Reference Design Targets & Standard Quantities', () => {
    it('accurately computes 125 g at ₹148 to ₹118/100 g (Zepto/Blinkit reference design)', () => {
      const result = calculateUnitPrice(148, '125 g');
      expect(result).not.toBeNull();
      expect(result.unitPrice).toBe(118);
      expect(result.unitMeasure).toBe('100 g');
      expect(result.display).toBe('₹118/100 g');
      expect(Math.round(result.pricePerKg)).toBe(1184);
    });

    it('accurately computes 100 g at ₹140 to ₹140/100 g (Reference Design Target)', () => {
      const result = calculateUnitPrice(140, '100 g');
      expect(result).not.toBeNull();
      expect(result.unitPrice).toBe(140);
      expect(result.unitMeasure).toBe('100 g');
      expect(result.display).toBe('₹140/100 g');
    });

    it('accurately computes 1 kg at ₹171 to ₹171/kg (Reference Design Target)', () => {
      const result = calculateUnitPrice(171, '1 kg');
      expect(result).not.toBeNull();
      expect(result.unitPrice).toBe(171);
      expect(result.unitMeasure).toBe('kg');
      expect(result.display).toBe('₹171/kg');
      expect(result.pricePerKg).toBe(171);
    });

    it('normalizes gram quantities >= 1000 g to kg pricing', () => {
      const result1000g = calculateUnitPrice(150, '1000 g');
      expect(result1000g).not.toBeNull();
      expect(result1000g.unitMeasure).toBe('kg');
      expect(result1000g.display).toBe('₹150/kg');

      const result1500g = calculateUnitPrice(300, '1500 g');
      expect(result1500g).not.toBeNull();
      expect(result1500g.unitPrice).toBe(200);
      expect(result1500g.unitMeasure).toBe('kg');
      expect(result1500g.display).toBe('₹200/kg');
    });

    it('accurately computes volume pricing under 1000 ml to 100 ml base', () => {
      const result = calculateUnitPrice(45, '500 ml');
      expect(result).not.toBeNull();
      expect(result.unitPrice).toBe(9);
      expect(result.unitMeasure).toBe('100 ml');
      expect(result.display).toBe('₹9/100 ml');

      const smallVolume = calculateUnitPrice(50, '200 ml');
      expect(smallVolume.unitPrice).toBe(25);
      expect(smallVolume.unitMeasure).toBe('100 ml');
      expect(smallVolume.display).toBe('₹25/100 ml');
    });

    it('accurately computes volume pricing for Liters and >= 1000 ml to L base', () => {
      const result1L = calculateUnitPrice(75, '1 L');
      expect(result1L).not.toBeNull();
      expect(result1L.unitPrice).toBe(75);
      expect(result1L.unitMeasure).toBe('L');
      expect(result1L.display).toBe('₹75/L');

      const result1000ml = calculateUnitPrice(80, '1000 ml');
      expect(result1000ml).not.toBeNull();
      expect(result1000ml.unitMeasure).toBe('L');
      expect(result1000ml.display).toBe('₹80/L');

      const result2L = calculateUnitPrice(130, '2 ltr');
      expect(result2L.unitPrice).toBe(65);
      expect(result2L.display).toBe('₹65/L');
    });

    it('accurately computes piece pricing for multi-pack counts', () => {
      const result = calculateUnitPrice(90, '6 pcs');
      expect(result).not.toBeNull();
      expect(result.unitPrice).toBe(15);
      expect(result.unitMeasure).toBe('pc');
      expect(result.display).toBe('₹15/pc');
    });

    it('returns null for single piece (value === 1) as unit pricing is redundant', () => {
      const result = calculateUnitPrice(20, '1 pc');
      expect(result).toBeNull();
    });
  });

  describe('calculateUnitPrice - Tier 2: Boundary & Corner Cases', () => {
    it('returns null for 0, negative, or non-numeric selling price', () => {
      expect(calculateUnitPrice(0, '500 g')).toBeNull();
      expect(calculateUnitPrice(-100, '500 g')).toBeNull();
      expect(calculateUnitPrice('free', '500 g')).toBeNull();
      expect(calculateUnitPrice(null, '500 g')).toBeNull();
      expect(calculateUnitPrice(undefined, '500 g')).toBeNull();
    });

    it('returns null for missing, invalid, or unrecognized quantity strings', () => {
      expect(calculateUnitPrice(150, null)).toBeNull();
      expect(calculateUnitPrice(150, '')).toBeNull();
      expect(calculateUnitPrice(150, 'unknown unit')).toBeNull();
      expect(calculateUnitPrice(150, '0 g')).toBeNull();
    });

    it('correctly handles numeric string prices', () => {
      const result = calculateUnitPrice('148', '125 g');
      expect(result).not.toBeNull();
      expect(result.unitPrice).toBe(118);
      expect(result.display).toBe('₹118/100 g');
    });
  });

  describe('formatUnitPrice - Object & Parameter Overloads', () => {
    it('returns formatted string for scalar arguments (price, quantity)', () => {
      expect(formatUnitPrice(148, '125 g')).toBe('₹118/100 g');
      expect(formatUnitPrice(171, '1 kg')).toBe('₹171/kg');
      expect(formatUnitPrice(45, '500 ml')).toBe('₹9/100 ml');
    });

    it('prefers pre-computed unitPriceDisplay if already on product object', () => {
      const product = {
        name: 'Enchanteur Powder',
        sellingPrice: 148,
        qnty: '125 g',
        unitPriceDisplay: '₹118/100 g',
      };
      expect(formatUnitPrice(product)).toBe('₹118/100 g');
    });

    it('calculates unit price on product object from sellingPrice and qnty', () => {
      const product = {
        name: 'India Gate Basmati Rice',
        sellingPrice: 171,
        qnty: '1 kg',
      };
      expect(formatUnitPrice(product)).toBe('₹171/kg');
    });

    it('falls back to mrp and quantity field aliases on product object', () => {
      const product = {
        name: 'Tata Sampann Dal',
        mrp: 120,
        quantity: '500 g',
      };
      expect(formatUnitPrice(product)).toBe('₹24/100 g');
    });

    it('returns empty string when calculation fails or input is invalid', () => {
      expect(formatUnitPrice(null)).toBe('');
      expect(formatUnitPrice(undefined)).toBe('');
      expect(formatUnitPrice({})).toBe('');
      expect(formatUnitPrice(0, '100 g')).toBe('');
      expect(formatUnitPrice(100, 'invalid')).toBe('');
    });
  });
});

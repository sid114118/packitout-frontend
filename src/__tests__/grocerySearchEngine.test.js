import { describe, it, expect } from 'vitest';
import {
  SYNONYM_MAP,
  CORE_INTENTS,
  normalizeStem,
  normalizeHinglishPhonetics,
  tokenMatches,
  expandQueryTokens,
  calculateGroceryRelevance,
  classifyProduct
} from '../utils/grocerySearchEngine.js';

describe('Frontend Grocery Search Engine Unit Tests', () => {
  describe('1. Search Relevance & Weighted Ranking (Core Promotion & Derivative Demotion)', () => {
    const pureCashew = {
      _id: 'p1',
      name: 'Tata Sampann 100% Pure Premium Cashews W320 500g',
      category: 'Dry Fruits & Cereals',
      subCategory: 'Dry Fruits, Nuts & Seeds',
      brand: 'Tata Sampann',
      searchTags: ['dry fruits', 'cashews', 'w320'],
      inStock: true
    };

    const kajuBiscuits = {
      _id: 'p2',
      name: 'Britannia Good Day Cashew / Kaju Cookies 100g',
      category: 'Bakery & Biscuits',
      subCategory: 'Cookies',
      brand: 'Britannia',
      searchTags: ['biscuits', 'cookies', 'kaju'],
      inStock: true
    };

    const kajuCake = {
      _id: 'p2b',
      name: 'Britannia Kaju Cake 50g',
      category: 'Bakery & Biscuits',
      subCategory: 'Cakes & Muffins',
      brand: 'Britannia',
      searchTags: ['cake', 'kaju'],
      inStock: true
    };

    const kajuMixture = {
      _id: 'p3',
      name: 'Haldiram Nagpur Kaju Mixture Namkeen 200g',
      category: 'Chips & Namkeen',
      subCategory: 'Namkeen',
      brand: 'Haldiram',
      searchTags: ['namkeen', 'kaju mixture'],
      inStock: true
    };

    const kajuIceCream = {
      _id: 'p4',
      name: 'Amul Gold Kaju Draksh Ice Cream Tub 1L',
      category: 'Ice Creams',
      subCategory: 'Tubs & Bricks',
      brand: 'Amul',
      searchTags: ['ice cream', 'kaju draksh'],
      inStock: true
    };

    it('ranks pure Kaju/Cashew dry fruits at the very top when searching "kaju"', () => {
      const qc = expandQueryTokens('kaju');
      const scorePure = calculateGroceryRelevance(pureCashew, qc);
      const scoreBiscuit = calculateGroceryRelevance(kajuBiscuits, qc);
      const scoreCake = calculateGroceryRelevance(kajuCake, qc);
      const scoreMixture = calculateGroceryRelevance(kajuMixture, qc);
      const scoreIceCream = calculateGroceryRelevance(kajuIceCream, qc);

      expect(scorePure).toBeGreaterThan(scoreBiscuit);
      expect(scorePure).toBeGreaterThan(scoreCake);
      expect(scorePure).toBeGreaterThan(scoreMixture);
      expect(scorePure).toBeGreaterThan(scoreIceCream);
    });

    it('boosts derivative products when user explicitly searches for them (e.g. "kaju biscuit")', () => {
      const qc = expandQueryTokens('kaju biscuit');
      const score = calculateGroceryRelevance(kajuBiscuits, qc);
      expect(score).toBeGreaterThanOrEqual(350);
    });

    it('activates category intent boosting for core terms (Dry Fruits & Cereals for "kaju")', () => {
      const qc = expandQueryTokens('kaju');
      expect(qc.intent).toBeTruthy();
      expect(qc.intent.intentCategories).toContain('Dry Fruits & Cereals');
      expect(qc.intent.derivativeWords).toContain('biscuit');
      expect(qc.intent.derivativeWords).toContain('namkeen');
      expect(qc.intent.derivativeWords).toContain('ice cream');
    });
  });

  describe('2. Synonyms, Bilingual (Hinglish/English) & Typo Matching', () => {
    it('retrieves Cashew-only titled item when searching Hindi/Hinglish "kaju"', () => {
      const qc = expandQueryTokens('kaju');
      expect(qc.expandedTokens.has('cashew')).toBe(true);
      expect(qc.expandedTokens.has('cashews')).toBe(true);

      const englishItem = {
        name: 'Whole Cashews 500g',
        category: 'Dry Fruits & Cereals',
        subCategory: 'Dry Fruits, Nuts & Seeds'
      };
      const score = calculateGroceryRelevance(englishItem, qc);
      expect(score).toBeGreaterThan(0);
    });

    it('retrieves Rice items when searching Hindi/Hinglish "chawal"', () => {
      const qc = expandQueryTokens('chawal');
      expect(qc.expandedTokens.has('rice')).toBe(true);
      expect(qc.expandedTokens.has('basmati')).toBe(true);

      const riceItem = {
        name: 'Daawat Rozana Gold Basmati Rice 5kg',
        category: 'Atta & Rice',
        subCategory: 'Basmati Rice'
      };
      const score = calculateGroceryRelevance(riceItem, qc);
      expect(score).toBeGreaterThan(0);
    });

    it('retrieves Sugar items when searching Hindi/Hinglish "chini" and "cheeni"', () => {
      const qc1 = expandQueryTokens('chini');
      expect(qc1.expandedTokens.has('sugar')).toBe(true);

      const qc2 = expandQueryTokens('cheeni');
      expect(qc2.expandedTokens.has('sugar')).toBe(true);
    });

    it('retrieves Turmeric items when searching Hindi/Hinglish "haldi"', () => {
      const qc = expandQueryTokens('haldi');
      expect(qc.expandedTokens.has('turmeric')).toBe(true);
    });

    it('supports multi-word query phrases: "cumin seeds", "cottage cheese", "clarified butter", "kidney beans"', () => {
      const qCumin = expandQueryTokens('cumin seeds');
      const jeeraItem = { name: 'MDH Jeera Whole Cumin Seeds 100g', category: 'Spices & Condiments' };
      expect(calculateGroceryRelevance(jeeraItem, qCumin)).toBeGreaterThan(0);

      const qCheese = expandQueryTokens('cottage cheese');
      const paneerItem = { name: 'Amul Malai Fresh Paneer 200g', category: 'Dairy, Bread & Eggs' };
      expect(calculateGroceryRelevance(paneerItem, qCheese)).toBeGreaterThan(0);

      const qButter = expandQueryTokens('clarified butter');
      const gheeItem = { name: 'Amul Pure Desi Ghee 1L Tin', category: 'Oil, Ghee & Salt' };
      expect(calculateGroceryRelevance(gheeItem, qButter)).toBeGreaterThan(0);

      const qBeans = expandQueryTokens('kidney beans');
      const rajmaItem = { name: 'Fortune Chitra Rajma 500g', category: 'Dals & Pulses' };
      expect(calculateGroceryRelevance(rajmaItem, qBeans)).toBeGreaterThan(0);
    });

    it('supports multi-word product titles with single-word query: "rajma" on "Kidney Beans", "paneer" on "Cottage Cheese"', () => {
      const qRajma = expandQueryTokens('rajma');
      const kidneyItem = { name: 'Organic Kidney Beans 500g', category: 'Dals & Pulses' };
      expect(calculateGroceryRelevance(kidneyItem, qRajma)).toBeGreaterThan(0);

      const qPaneer = expandQueryTokens('paneer');
      const cottageItem = { name: 'Milky Mist Fresh Cottage Cheese 200g', category: 'Dairy, Bread & Eggs' };
      expect(calculateGroceryRelevance(cottageItem, qPaneer)).toBeGreaterThan(0);
    });

    it('handles typo matching: "chawall" matches Basmati Rice, "casheww" matches Cashew Nuts', () => {
      const qChawall = expandQueryTokens('chawall');
      const riceItem = { name: 'Fortune Rozzana Basmati Rice 1kg', category: 'Atta & Rice' };
      expect(calculateGroceryRelevance(riceItem, qChawall)).toBeGreaterThan(0);

      const qCasheww = expandQueryTokens('casheww');
      const cashewItem = { name: 'Royal Premium Cashew Nuts W320 250g', category: 'Dry Fruits & Cereals' };
      expect(calculateGroceryRelevance(cashewItem, qCasheww)).toBeGreaterThan(0);
    });

    it('strictly prevents short-word false-positive typos: "atta" does NOT match Data Cable, "beans" does NOT match Besan', () => {
      const qAtta = expandQueryTokens('atta');
      const cableItem = { name: 'USB Type C Fast Charging Data Cable 1m', category: 'Home & Office' };
      expect(calculateGroceryRelevance(cableItem, qAtta)).toBe(-1);

      const qBeans = expandQueryTokens('beans');
      const besanItem = { name: 'Fortune Besan 500g', category: 'Atta & Rice' };
      expect(calculateGroceryRelevance(besanItem, qBeans)).toBe(-1);
    });

    it('supports plural stemming: "cashews" retrieves "cashew" and vice-versa', () => {
      expect(normalizeStem('cashews')).toBe('cashew');
      expect(normalizeStem('biscuits')).toBe('biscuit');
      expect(normalizeStem('eggs')).toBe('egg');
      expect(tokenMatches('cashews', 'cashew')).toBe(true);
      expect(tokenMatches('biscutes', 'biscuit')).toBe(true);
    });

    it('handles phonetic and fuzzy typos like "kajoo" or "kajju" for "kaju"', () => {
      expect(normalizeHinglishPhonetics('kajoo')).toBe('kaju');
      expect(normalizeHinglishPhonetics('kajju')).toBe('kaju');
      expect(tokenMatches('kajoo', 'kaju')).toBe(true);
      expect(tokenMatches('kajju', 'kaju')).toBe(true);

      const qc = expandQueryTokens('kajoo');
      expect(qc.expandedTokens.has('kaju')).toBe(true);
      expect(qc.expandedTokens.has('cashew')).toBe(true);
    });
  });

  describe('3. Catalog Misclassification Self-Healing & Classification Audit', () => {
    it('reclassifies miscategorized bathing soap out of Sweets & Chocolates into Bath & Body', () => {
      const fixed = classifyProduct({
        name: 'Dove Cream Beauty Bathing Bar Soap 100g',
        category: 'Sweets & Chocolates'
      });
      expect(fixed).toBeTruthy();
      expect(fixed.category).toBe('Bath & Body');
      expect(fixed.subCategory).toBe('Bar Soaps');
    });

    it('reclassifies hair oil out of Cooking Oil into Beauty & Grooming > Hair Care & Oils', () => {
      const fixed = classifyProduct({
        name: 'Bajaj Almond Drops Non Sticky Hair Oil 300 ml',
        category: 'Cooking Oil'
      });
      expect(fixed).toBeTruthy();
      expect(fixed.category).toBe('Beauty & Grooming');
      expect(fixed.subCategory).toBe('Hair Care & Oils');
    });

    it('reclassifies face scrubs out of Dry Fruits into Beauty & Grooming > Skin Care & Lotions', () => {
      const fixed = classifyProduct({
        name: 'Everyuth Walnut Face Scrub 25g',
        category: 'Dry Fruits & Cereals'
      });
      expect(fixed).toBeTruthy();
      expect(fixed.category).toBe('Beauty & Grooming');
      expect(fixed.subCategory).toBe('Skin Care & Lotions');
    });

    it('reclassifies chocolates out of Dry Fruits into Sweets & Chocolates > Chocolates', () => {
      const fixed = classifyProduct({
        name: 'Cadbury Silk Roast Almond Chocolate Bar 50g',
        category: 'Dry Fruits & Cereals'
      });
      expect(fixed).toBeTruthy();
      expect(fixed.category).toBe('Sweets & Chocolates');
      expect(fixed.subCategory).toBe('Chocolates');
    });

    it('reclassifies cooking oils named after grains out of Atta & Rice into Oil, Ghee & Salt', () => {
      const fixed = classifyProduct({
        name: 'Fortune Rice Bran Refined Oil 750g Pouch',
        category: 'Atta & Rice',
        subCategory: 'Daily Rice'
      });
      expect(fixed).toBeTruthy();
      expect(fixed.category).toBe('Oil, Ghee & Salt');
      expect(fixed.subCategory).toBe('Refined Oils');
    });

    it('reclassifies ice cream out of Bakery & Biscuits into Ice Creams > Cones & Bars', () => {
      const fixed = classifyProduct({
        name: 'Amul Tricone Butterscotch Ice Cream Cone 120 ml',
        category: 'Bakery & Biscuits'
      });
      expect(fixed).toBeTruthy();
      expect(fixed.category).toBe('Ice Creams');
      expect(fixed.subCategory).toBe('Cones & Bars');
    });
  });
});

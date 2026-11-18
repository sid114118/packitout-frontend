import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { extractDynamicFilters, applyFiltersAndSort, inferProductAttributes } from '../utils/dynamicFilterExtractor.js';
import InventoryTab from '../components/ShopDashboard/InventoryTab.jsx';

// Mock DialogProvider
vi.mock('../ui/DialogProvider.jsx', () => ({
  useToast: () => vi.fn(),
  useConfirm: () => vi.fn().mockResolvedValue(true),
  usePrompt: () => vi.fn().mockResolvedValue('5'),
}));

describe('Performance & UX Fixes Tests', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('Dynamic Filter Extractor Robustness & Faceting', () => {
    it('gracefully handles arrays with null or non-object elements without throwing TypeError', () => {
      const dirtyProducts = [
        null,
        undefined,
        { _id: '1', name: 'Ponds Powder 100g', brand: 'Ponds', sellingPrice: 90, qnty: '100 g', category: 'Beauty & Grooming' },
        null,
        { _id: '2', name: 'Nivea Talc 250g', brand: 'Nivea', sellingPrice: 150, qnty: '250 g', category: 'Beauty & Grooming' },
        false,
        {},
      ];

      expect(() => {
        const filters = extractDynamicFilters(dirtyProducts, 'powder', 'Beauty & Grooming');
        expect(filters).toBeDefined();
        expect(filters.priceRange.min).toBe(90);
        expect(filters.priceRange.max).toBe(150);
        expect(filters.filterPills.some(p => p.key === 'brand')).toBe(true);
      }).not.toThrow();
    });

    it('filters out empty, whitespace, and NaN brand names from brand filter pill', () => {
      const products = [
        { _id: '1', name: 'Milk 1L', brand: 'Amul', sellingPrice: 60, qnty: '1L' },
        { _id: '2', name: 'Curd 500g', brand: 'nan', sellingPrice: 40, qnty: '500g' },
        { _id: '3', name: 'Butter', brand: '   ', sellingPrice: 50, qnty: '100g' },
        { _id: '4', name: 'Cheese', brand: undefined, sellingPrice: 120, qnty: '200g' },
      ];

      const filters = extractDynamicFilters(products, 'milk', 'Dairy');
      const brandPill = filters.filterPills.find(p => p.key === 'brand');
      expect(brandPill).toBeDefined();
      expect(brandPill.options.map(o => o.value)).toEqual(['Amul']);
    });

    it('applies brand multi-select filter efficiently using Set matching', () => {
      const items = [
        { _id: '1', name: 'Ponds Face Powder', brand: 'Ponds', sellingPrice: 100 },
        { _id: '2', name: 'Nivea Soft Cream', brand: 'Nivea', sellingPrice: 180 },
        { _id: '3', name: 'Lakme Compact', brand: 'Lakme', sellingPrice: 220 },
      ];

      const result = applyFiltersAndSort(items, { brand: ['Ponds', 'Lakme'] });
      expect(result.length).toBe(2);
      expect(result.map(r => r.brand)).toEqual(['Ponds', 'Lakme']);
    });

    it('applies numeric price bounds and ignores invalid items safely', () => {
      const items = [
        null,
        { _id: '1', name: 'Soap A', sellingPrice: 30 },
        { _id: '2', name: 'Soap B', sellingPrice: 80 },
        { _id: '3', name: 'Soap C', sellingPrice: 150 },
      ];

      const result = applyFiltersAndSort(items, { minPrice: 50, maxPrice: 100 });
      expect(result.length).toBe(1);
      expect(result[0]._id).toBe('2');
    });
  });

  describe('InventoryTab Catalog & Store Loading States', () => {
    const mockShopData = {
      _id: 'shop_123',
      name: 'Test Kirana',
      inventory: [],
    };

    it('renders master catalog loading spinner and does NOT show false "added every product" empty state while fetching', () => {
      render(
        <InventoryTab
          shopData={mockShopData}
          masterCatalog={[]}
          isCatalogLoading={true}
          catalogError={null}
          isInventoryLoading={false}
          handleInventoryUpdate={vi.fn()}
          handleInventoryRemove={vi.fn()}
          onInventoryRefresh={vi.fn()}
          fetchMasterCatalog={vi.fn()}
        />
      );

      // Open collapsible "Add New Products" section
      const toggleBtn = screen.getByText(/Add New Products to Store/i);
      fireEvent.click(toggleBtn);

      expect(screen.getByText('Loading master catalog...')).toBeInTheDocument();
      expect(screen.queryByText('🎉 You have added every available product!')).not.toBeInTheDocument();
    });

    it('renders error state and retry button if master catalog fetch fails', () => {
      const retryMock = vi.fn();
      render(
        <InventoryTab
          shopData={mockShopData}
          masterCatalog={[]}
          isCatalogLoading={false}
          catalogError="Network timeout"
          isInventoryLoading={false}
          handleInventoryUpdate={vi.fn()}
          handleInventoryRemove={vi.fn()}
          onInventoryRefresh={vi.fn()}
          fetchMasterCatalog={retryMock}
        />
      );

      // Open collapsible
      fireEvent.click(screen.getByText(/Add New Products to Store/i));

      expect(screen.getByText(/Could not load master catalog \(Network timeout\)/i)).toBeInTheDocument();
      const retryBtn = screen.getByText('🔄 Retry Catalog');
      expect(retryBtn).toBeInTheDocument();

      fireEvent.click(retryBtn);
      expect(retryMock).toHaveBeenCalledTimes(1);
      expect(screen.queryByText('🎉 You have added every available product!')).not.toBeInTheDocument();
    });

    it('renders store inventory loading spinner when isInventoryLoading is true and inventory is empty', () => {
      render(
        <InventoryTab
          shopData={mockShopData}
          masterCatalog={[]}
          isCatalogLoading={false}
          catalogError={null}
          isInventoryLoading={true}
          handleInventoryUpdate={vi.fn()}
          handleInventoryRemove={vi.fn()}
          onInventoryRefresh={vi.fn()}
          fetchMasterCatalog={vi.fn()}
        />
      );

      expect(screen.getByText('Loading store inventory...')).toBeInTheDocument();
      expect(screen.queryByText('Your store has no products yet')).not.toBeInTheDocument();
    });

    it('shows "🎉 You have added every available product!" only when catalog completed loading and 0 items remain', () => {
      const catalog = [
        { _id: 'prod_1', name: 'Milk 1L', mrp: 60 },
      ];
      const shopWithAllItems = {
        _id: 'shop_123',
        name: 'Test Kirana',
        inventory: [
          { product: { _id: 'prod_1', name: 'Milk 1L', mrp: 60 }, sellingPrice: 58, inStock: true }
        ],
      };

      render(
        <InventoryTab
          shopData={shopWithAllItems}
          masterCatalog={catalog}
          isCatalogLoading={false}
          catalogError={null}
          isInventoryLoading={false}
          handleInventoryUpdate={vi.fn()}
          handleInventoryRemove={vi.fn()}
          onInventoryRefresh={vi.fn()}
          fetchMasterCatalog={vi.fn()}
        />
      );

      fireEvent.click(screen.getByText(/Add New Products to Store/i));
      expect(screen.getByText('🎉 You have added every available product!')).toBeInTheDocument();
    });
  });
});

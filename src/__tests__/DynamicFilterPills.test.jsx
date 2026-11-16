import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import SearchFilterBar from '../components/search/SearchFilterBar.jsx';
import { extractDynamicFilters, inferProductAttributes } from '../utils/dynamicFilterExtractor.js';

describe('DynamicFilterPills Tests (SearchFilterBar & dynamicFilterExtractor)', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const powderPills = [
    {
      key: 'gender',
      label: 'Gender',
      type: 'single_select',
      options: [
        { value: 'Women', label: 'Women', count: 18 },
        { value: 'Men', label: 'Men', count: 12 },
        { value: 'Baby', label: 'Baby', count: 32 },
        { value: 'Unisex', label: 'Unisex', count: 32 },
      ],
    },
    {
      key: 'brand',
      label: 'Brand',
      type: 'multi_select',
      options: [
        { value: 'Ponds', label: 'Ponds', count: 24 },
        { value: 'Nivea', label: 'Nivea', count: 16 },
        { value: 'Enchanteur', label: 'Enchanteur', count: 8 },
      ],
    },
  ];

  const ricePills = [
    {
      key: 'grainType',
      label: 'Grain Type',
      type: 'single_select',
      options: [
        { value: 'Basmati', label: 'Basmati', count: 15 },
        { value: 'Daily Rice', label: 'Daily Rice', count: 22 },
        { value: 'Brown Rice', label: 'Brown Rice', count: 5 },
      ],
    },
    {
      key: 'pricePerUnit',
      label: 'Price per kg',
      type: 'single_select',
      options: [
        { value: 'under_50', label: 'Under ₹50/kg', count: 8 },
        { value: '50_100', label: '₹50 - ₹100/kg', count: 19 },
        { value: '100_150', label: '₹100 - ₹150/kg', count: 11 },
        { value: '150_plus', label: 'Above ₹150/kg', count: 4 },
      ],
    },
  ];

  describe('Tier 1: Standard Filter & Sort Pills Rendering', () => {
    it('renders standard pills: Filters, Sort, and Price', () => {
      render(
        <SearchFilterBar
          filterPills={[]}
          activeFilters={{}}
          activeSort="relevance"
          onFilterChange={vi.fn()}
          onSortChange={vi.fn()}
          onClearFilters={vi.fn()}
        />
      );

      expect(screen.getByText('Filters')).toBeInTheDocument();
      expect(screen.getByText('Sort')).toBeInTheDocument();
      expect(screen.getByText('Price')).toBeInTheDocument();
    });

    it('dynamically adapts for powder query: renders Gender and Brand pills', () => {
      render(
        <SearchFilterBar
          filterPills={powderPills}
          activeFilters={{}}
          activeSort="relevance"
          onFilterChange={vi.fn()}
          onSortChange={vi.fn()}
          onClearFilters={vi.fn()}
        />
      );

      expect(screen.getByText('Gender')).toBeInTheDocument();
      expect(screen.getByText('Brand')).toBeInTheDocument();
    });

    it('dynamically adapts for rice query: renders Grain Type and Price per kg pills', () => {
      render(
        <SearchFilterBar
          filterPills={ricePills}
          activeFilters={{}}
          activeSort="relevance"
          onFilterChange={vi.fn()}
          onSortChange={vi.fn()}
          onClearFilters={vi.fn()}
        />
      );

      expect(screen.getByText('Grain Type')).toBeInTheDocument();
      expect(screen.getByText('Price per kg')).toBeInTheDocument();
    });

    it('opens Sort menu on click and invokes onSortChange on option selection', () => {
      const handleSortChange = vi.fn();
      render(
        <SearchFilterBar
          filterPills={powderPills}
          activeFilters={{}}
          activeSort="relevance"
          onFilterChange={vi.fn()}
          onSortChange={handleSortChange}
          onClearFilters={vi.fn()}
        />
      );

      // Click Sort pill button
      const sortBtn = screen.getByText('Sort').closest('button');
      fireEvent.click(sortBtn);

      // Verify Sort By dropdown title appears
      expect(screen.getByText('Sort By')).toBeInTheDocument();
      expect(screen.getByText('Price: Low to High')).toBeInTheDocument();
      expect(screen.getByText('Price: High to Low')).toBeInTheDocument();

      // Click "Price: Low to High"
      fireEvent.click(screen.getByText('Price: Low to High'));
      expect(handleSortChange).toHaveBeenCalledWith('price_asc');
    });

    it('applies pio-pill-active class to Sort pill when activeSort is not relevance', () => {
      render(
        <SearchFilterBar
          filterPills={[]}
          activeFilters={{}}
          activeSort="price_asc"
          onFilterChange={vi.fn()}
          onSortChange={vi.fn()}
          onClearFilters={vi.fn()}
        />
      );

      const sortBtn = screen.getByText('Price: Low to High').closest('button');
      expect(sortBtn).toHaveClass('pio-pill-active');
    });

    it('opens Price menu on click and invokes onFilterChange with price bounds', () => {
      const handleFilterChange = vi.fn();
      render(
        <SearchFilterBar
          filterPills={[]}
          activeFilters={{}}
          activeSort="relevance"
          onFilterChange={handleFilterChange}
          onSortChange={vi.fn()}
          onClearFilters={vi.fn()}
        />
      );

      const priceBtn = screen.getByText('Price').closest('button');
      fireEvent.click(priceBtn);

      expect(screen.getByText('Price Range')).toBeInTheDocument();
      expect(screen.getByText('Under ₹100')).toBeInTheDocument();
      expect(screen.getByText('₹100 - ₹200')).toBeInTheDocument();

      // Click "Under ₹100" (max: 100)
      fireEvent.click(screen.getByText('Under ₹100'));
      expect(handleFilterChange).toHaveBeenCalledWith({
        minPrice: undefined,
        maxPrice: 100,
      });
    });

    it('toggles off active price tier when clicked again', () => {
      const handleFilterChange = vi.fn();
      render(
        <SearchFilterBar
          filterPills={[]}
          activeFilters={{ minPrice: 100, maxPrice: 200 }}
          activeSort="relevance"
          onFilterChange={handleFilterChange}
          onSortChange={vi.fn()}
          onClearFilters={vi.fn()}
        />
      );

      // Pill button displays active value "Under ₹200"
      const priceBtn = screen.getByText('Under ₹200').closest('button');
      expect(priceBtn).toHaveClass('pio-pill-active');
      fireEvent.click(priceBtn);

      // In dropdown, click "₹100 - ₹200" to toggle off
      const option = screen.getByText('₹100 - ₹200');
      fireEvent.click(option);

      expect(handleFilterChange).toHaveBeenCalledWith({
        minPrice: undefined,
        maxPrice: undefined,
      });
    });
  });

  describe('Tier 2: Context-Aware Dynamic Pills & Options Selection', () => {
    it('opens dynamic pill dropdown and selects single-select option (Gender: Women)', () => {
      const handleFilterChange = vi.fn();
      render(
        <SearchFilterBar
          filterPills={powderPills}
          activeFilters={{}}
          activeSort="relevance"
          onFilterChange={handleFilterChange}
          onSortChange={vi.fn()}
          onClearFilters={vi.fn()}
        />
      );

      const genderBtn = screen.getByText('Gender').closest('button');
      fireEvent.click(genderBtn);

      expect(screen.getByText('Select Gender')).toBeInTheDocument();
      expect(screen.getByText('Women')).toBeInTheDocument();
      expect(screen.getByText('18')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Women'));
      expect(handleFilterChange).toHaveBeenCalledWith({
        gender: 'Women',
      });
    });

    it('deselected single-select option when clicking it again', () => {
      const handleFilterChange = vi.fn();
      render(
        <SearchFilterBar
          filterPills={powderPills}
          activeFilters={{ gender: 'Women' }}
          activeSort="relevance"
          onFilterChange={handleFilterChange}
          onSortChange={vi.fn()}
          onClearFilters={vi.fn()}
        />
      );

      // Pill button displays active value "Women"
      const womenPill = screen.getByText('Women').closest('button');
      expect(womenPill).toHaveClass('pio-pill-active');
      fireEvent.click(womenPill);

      // In dropdown, click Women to toggle off
      const dropdownOption = screen.getAllByText('Women')[1];
      fireEvent.click(dropdownOption);

      expect(handleFilterChange).toHaveBeenCalledWith({
        gender: undefined,
      });
    });

    it('handles multi-select dynamic pill (Brand) with multiple additions and removals', () => {
      const handleFilterChange = vi.fn();
      render(
        <SearchFilterBar
          filterPills={powderPills}
          activeFilters={{ brand: ['Ponds'] }}
          activeSort="relevance"
          onFilterChange={handleFilterChange}
          onSortChange={vi.fn()}
          onClearFilters={vi.fn()}
        />
      );

      // Pill shows "Brand (1)"
      const brandBtn = screen.getByText('Brand (1)').closest('button');
      expect(brandBtn).toHaveClass('pio-pill-active');
      fireEvent.click(brandBtn);

      // Click "Nivea" to add
      fireEvent.click(screen.getByText('Nivea'));
      expect(handleFilterChange).toHaveBeenCalledWith({
        brand: ['Ponds', 'Nivea'],
      });
    });

    it('closes multi-select dropdown when Apply button is clicked', () => {
      render(
        <SearchFilterBar
          filterPills={powderPills}
          activeFilters={{}}
          activeSort="relevance"
          onFilterChange={vi.fn()}
          onSortChange={vi.fn()}
          onClearFilters={vi.fn()}
        />
      );

      const brandBtn = screen.getByText('Brand').closest('button');
      fireEvent.click(brandBtn);

      const applyBtn = screen.getByText('Apply');
      expect(applyBtn).toBeInTheDocument();
      fireEvent.click(applyBtn);

      expect(screen.queryByText('Select Brand')).not.toBeInTheDocument();
    });
  });

  describe('Tier 3: All Filters Drawer, Active Badges & Clear All', () => {
    it('displays active filter count badge on Filters pill when activeCount > 0', () => {
      render(
        <SearchFilterBar
          filterPills={powderPills}
          activeFilters={{ gender: 'Women', brand: ['Ponds', 'Nivea'] }}
          activeSort="relevance"
          onFilterChange={vi.fn()}
          onSortChange={vi.fn()}
          onClearFilters={vi.fn()}
        />
      );

      const filtersBtn = screen.getByText('Filters').closest('button');
      expect(filtersBtn).toHaveClass('pio-pill-active');
      // activeCount is 1 (gender) + 2 (brand) = 3
      expect(within(filtersBtn).getByText('3')).toBeInTheDocument();
    });

    it('renders "Clear all" button when filters are active and calls onClearFilters', () => {
      const handleClear = vi.fn();
      render(
        <SearchFilterBar
          filterPills={powderPills}
          activeFilters={{ gender: 'Baby' }}
          activeSort="relevance"
          onFilterChange={vi.fn()}
          onSortChange={vi.fn()}
          onClearFilters={handleClear}
        />
      );

      const clearBtn = screen.getByText('Clear all');
      expect(clearBtn).toBeInTheDocument();
      fireEvent.click(clearBtn);

      expect(handleClear).toHaveBeenCalledTimes(1);
    });

    it('renders "Clear all" button when activeSort is not relevance', () => {
      const handleClear = vi.fn();
      render(
        <SearchFilterBar
          filterPills={[]}
          activeFilters={{}}
          activeSort="price_desc"
          onFilterChange={vi.fn()}
          onSortChange={vi.fn()}
          onClearFilters={handleClear}
        />
      );

      const clearBtn = screen.getByText('Clear all');
      expect(clearBtn).toBeInTheDocument();
      fireEvent.click(clearBtn);

      expect(handleClear).toHaveBeenCalledTimes(1);
    });

    it('opens All Filters drawer when clicking Filters button and supports Reset All', () => {
      const handleClear = vi.fn();
      render(
        <SearchFilterBar
          filterPills={powderPills}
          activeFilters={{ gender: 'Women' }}
          activeSort="relevance"
          onFilterChange={vi.fn()}
          onSortChange={vi.fn()}
          onClearFilters={handleClear}
        />
      );

      const filtersBtn = screen.getByText('Filters').closest('button');
      fireEvent.click(filtersBtn);

      expect(screen.getByText('All Filters')).toBeInTheDocument();
      const resetBtn = screen.getByText('Reset All');
      fireEvent.click(resetBtn);

      expect(handleClear).toHaveBeenCalledTimes(1);
    });

    it('closes dropdown when clicking outside', () => {
      render(
        <div>
          <div data-testid="outside-area">Outside</div>
          <SearchFilterBar
            filterPills={powderPills}
            activeFilters={{}}
            activeSort="relevance"
            onFilterChange={vi.fn()}
            onSortChange={vi.fn()}
            onClearFilters={vi.fn()}
          />
        </div>
      );

      // Open Sort dropdown
      fireEvent.click(screen.getByText('Sort').closest('button'));
      expect(screen.getByText('Sort By')).toBeInTheDocument();

      // Click outside
      fireEvent.pointerDown(screen.getByTestId('outside-area'));
      expect(screen.queryByText('Sort By')).not.toBeInTheDocument();
    });
  });

  describe('Tier 4: dynamicFilterExtractor Integration Verification', () => {
    it('infers attributes and extracts Gender and Brand pills for powder catalog', () => {
      const samplePowderCatalog = [
        {
          _id: 'p1',
          name: 'Enchanteur Romantic Perfumed Talcum Powder for Women',
          brand: 'Enchanteur',
          category: 'Beauty & Grooming',
          subCategory: 'Deodorants & Fragrances',
          qnty: '125 g',
          sellingPrice: 148,
          mrp: 185,
        },
        {
          _id: 'p2',
          name: 'Himalaya Baby Powder',
          brand: 'Himalaya',
          category: 'Baby Care',
          subCategory: 'Baby Skin Care',
          qnty: '200 g',
          sellingPrice: 195,
          mrp: 230,
        },
      ];

      const { filterPills } = extractDynamicFilters(samplePowderCatalog, 'powder', 'Beauty & Grooming');
      const pillKeys = filterPills.map(p => p.key);

      expect(pillKeys).toContain('gender');
      expect(pillKeys).toContain('brand');

      const genderPill = filterPills.find(p => p.key === 'gender');
      const genderValues = genderPill.options.map(o => o.value);
      expect(genderValues).toContain('Women');
      expect(genderValues).toContain('Baby');
    });

    it('extracts Grain Type and Price per kg pills for rice catalog', () => {
      const sampleRiceCatalog = [
        {
          _id: 'r1',
          name: 'India Gate Basmati Rice Feast Rozzana',
          brand: 'India Gate',
          category: 'Atta, Rice & Dal',
          qnty: '1 kg',
          sellingPrice: 110,
          mrp: 135,
        },
        {
          _id: 'r2',
          name: 'Fortune Daily Kolam Rice',
          brand: 'Fortune',
          category: 'Atta, Rice & Dal',
          qnty: '5 kg',
          sellingPrice: 350,
          mrp: 420,
        },
      ];

      const { filterPills } = extractDynamicFilters(sampleRiceCatalog, 'rice', 'Atta, Rice & Dal');
      const pillKeys = filterPills.map(p => p.key);

      expect(pillKeys).toContain('grainType');
      expect(pillKeys).toContain('brand');
      expect(pillKeys).toContain('pricePerUnit');

      const grainPill = filterPills.find(p => p.key === 'grainType');
      const grainVals = grainPill.options.map(o => o.value);
      expect(grainVals).toContain('Basmati');
      expect(grainVals).toContain('Daily Rice');
    });

    it('safely handles empty products array', () => {
      const res = extractDynamicFilters([], '', '');
      expect(res.filterPills).toEqual([]);
      expect(res.priceRange).toEqual({ min: 0, max: 500 });
    });
  });
});

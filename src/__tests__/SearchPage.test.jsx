import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act, waitFor, within } from '@testing-library/react';
import SearchPage from '../SearchPage.jsx';

describe('SearchPage Integration Tests', () => {
  const mockItems = [
    {
      _id: 'prod_1',
      itemGroupId: 'enchanteur_talc_group',
      name: 'Enchanteur Romantic Perfumed Talcum Powder for Women',
      brand: 'Enchanteur',
      category: 'Beauty & Grooming',
      subCategory: 'Deodorants & Fragrances',
      qnty: '125 g',
      sellingPrice: 148,
      mrp: 185,
      attributes: { gender: 'Women' },
      image: 'https://example.com/enchanteur.jpg',
      variants: [
        {
          _id: 'prod_1_125',
          qnty: '125 g',
          sellingPrice: 148,
          mrp: 185,
          unitPriceDisplay: '₹118/100 g',
        },
        {
          _id: 'prod_1_250',
          qnty: '250 g',
          sellingPrice: 260,
          mrp: 320,
          unitPriceDisplay: '₹104/100 g',
        },
      ],
    },
    {
      _id: 'prod_2',
      name: 'Himalaya Baby Powder',
      brand: 'Himalaya',
      category: 'Baby Care',
      subCategory: 'Baby Powder',
      qnty: '200 g',
      sellingPrice: 195,
      mrp: 230,
      attributes: { gender: 'Baby' },
      image: 'https://example.com/himalaya.jpg',
    },
    {
      _id: 'prod_3',
      name: 'Amul Taaza Homogenised Toned Milk',
      brand: 'Amul',
      category: 'Dairy & Breakfast',
      subCategory: 'Milk',
      qnty: '1 L',
      sellingPrice: 72,
      mrp: 74,
      image: 'https://example.com/amul_milk.jpg',
    },
    {
      _id: 'prod_4',
      name: 'India Gate Feast Rozzana Basmati Rice',
      brand: 'India Gate',
      category: 'Atta, Rice & Dal',
      subCategory: 'Rice',
      qnty: '1 kg',
      sellingPrice: 110,
      mrp: 135,
      attributes: { grainType: 'Basmati' },
      image: 'https://example.com/basmati.jpg',
    },
  ];

  beforeEach(() => {
    vi.useFakeTimers();
    // Mock global fetch for catalog APIs
    global.fetch = vi.fn().mockImplementation((url) => {
      const u = String(url);
      if (u.includes('/catalog/autocomplete')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              query: 'powder',
              suggestions: [
                {
                  id: 'cat_powder',
                  text: 'Powder',
                  category: 'Beauty & Grooming',
                  subCategory: 'Deodorants & Fragrances',
                  type: 'category',
                  thumbnail: 'https://res.cloudinary.com/dj48tkcsw/image/upload/v1775368062/Products/Amul/kp5mli0uneidjzg4ytmm.webp',
                },
                {
                  id: 'sub_face_powder',
                  text: 'Face powder',
                  category: 'Beauty & Grooming',
                  subCategory: 'Makeup & Cosmetics',
                  type: 'subCategory',
                  thumbnail: 'https://res.cloudinary.com/dj48tkcsw/image/upload/v1775374531/Products/Amul/tdxtg1ocwgcqiqzterj9.avif',
                },
              ],
            }),
        });
      }
      if (u.includes('/catalog/filters')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              query: 'powder',
              category: 'Beauty & Grooming',
              sortOptions: [
                { id: 'relevance', label: 'Relevance' },
                { id: 'price_asc', label: 'Price: Low to High' },
                { id: 'price_desc', label: 'Price: High to Low' },
              ],
              priceRange: { min: 140, max: 260 },
              filterPills: [
                {
                  key: 'gender',
                  label: 'Gender',
                  type: 'single_select',
                  options: [
                    { value: 'Women', label: 'Women', count: 1 },
                    { value: 'Baby', label: 'Baby', count: 1 },
                  ],
                },
              ],
            }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ items: [] }),
      });
    });
  });

  afterEach(() => {
    act(() => {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    });
    cleanup();
    vi.clearAllMocks();
  });

  describe('Tier 1: Initial Empty State & Autocomplete Overlay Flow', () => {
    it('renders search input with placeholder and popular search categories', () => {
      render(
        <SearchPage
          items={mockItems}
          onClose={vi.fn()}
          onQuickAdd={vi.fn()}
        />
      );

      const input = screen.getByPlaceholderText('Search "Maggi", "Milk"…');
      expect(input).toBeInTheDocument();
      expect(screen.getByText('Popular searches')).toBeInTheDocument();
      expect(screen.getByText('Milk')).toBeInTheDocument();
      expect(screen.getByText('Bread')).toBeInTheDocument();
    });

    it('clicking a popular category immediately performs search and displays matching products', () => {
      render(
        <SearchPage
          items={mockItems}
          onClose={vi.fn()}
          onQuickAdd={vi.fn()}
        />
      );

      // Click "Milk" popular search button
      const milkBtn = screen.getByText('Milk').closest('button');
      fireEvent.click(milkBtn);

      // Settle timers
      act(() => {
        vi.advanceTimersByTime(350);
      });

      // Product card for Amul Milk should be displayed
      expect(screen.getByText('Amul Taaza Homogenised Toned Milk')).toBeInTheDocument();
      expect(screen.getByText('₹72')).toBeInTheDocument();
    });

    it('typing query displays SearchAutocompleteOverlay with suggestions and category thumbnails', () => {
      render(
        <SearchPage
          items={mockItems}
          onClose={vi.fn()}
          onQuickAdd={vi.fn()}
        />
      );

      const input = screen.getByPlaceholderText('Search "Maggi", "Milk"…');
      fireEvent.change(input, { target: { value: 'powder' } });

      // Autocomplete overlay items should appear immediately
      const facePowderSuggestion = screen.getByText(/Face/i);
      expect(facePowderSuggestion).toBeInTheDocument();

      // Category thumbnails should be rendered
      const images = screen.getAllByRole('img');
      expect(images.length).toBeGreaterThanOrEqual(1);
    });

    it('selecting an autocomplete suggestion applies query and category filter and closes overlay', () => {
      render(
        <SearchPage
          items={mockItems}
          onClose={vi.fn()}
          onQuickAdd={vi.fn()}
        />
      );

      const input = screen.getByPlaceholderText('Search "Maggi", "Milk"…');
      fireEvent.change(input, { target: { value: 'powder' } });

      // Click Face powder suggestion
      const suggestionItem = screen.getByText(/Face/i).closest('[role="button"]');
      expect(suggestionItem).not.toBeNull();
      fireEvent.click(suggestionItem);

      // Input value should be updated to "Face powder"
      expect(input.value).toBe('Face powder');

      // Overlay should be closed
      expect(screen.queryByRole('img', { name: 'Face powder' })).not.toBeInTheDocument();
    });

    it('clicking clear search "✖" button resets search query and closes autocomplete', () => {
      render(
        <SearchPage
          items={mockItems}
          onClose={vi.fn()}
          onQuickAdd={vi.fn()}
        />
      );

      const input = screen.getByPlaceholderText('Search "Maggi", "Milk"…');
      fireEvent.change(input, { target: { value: 'powder' } });

      const clearBtn = screen.getByLabelText('Clear search');
      expect(clearBtn).toBeInTheDocument();
      fireEvent.click(clearBtn);

      expect(input.value).toBe('');
      expect(screen.getByText('Popular searches')).toBeInTheDocument();
    });
  });

  describe('Tier 2: Results View & SearchFilterBar Dynamic Filtering', () => {
    it('renders SearchFilterBar when query is active', () => {
      render(
        <SearchPage
          items={mockItems}
          onClose={vi.fn()}
          onQuickAdd={vi.fn()}
        />
      );

      const input = screen.getByPlaceholderText('Search "Maggi", "Milk"…');
      fireEvent.change(input, { target: { value: 'powder' } });

      act(() => {
        vi.advanceTimersByTime(350);
      });

      expect(screen.getByText('Filters')).toBeInTheDocument();
      expect(screen.getByText('Sort')).toBeInTheDocument();
      expect(screen.getByText('Price')).toBeInTheDocument();
    });

    it('renders EnhancedProductCard items in results view', () => {
      render(
        <SearchPage
          items={mockItems}
          onClose={vi.fn()}
          onQuickAdd={vi.fn()}
        />
      );

      const input = screen.getByPlaceholderText('Search "Maggi", "Milk"…');
      fireEvent.change(input, { target: { value: 'powder' } });

      act(() => {
        vi.advanceTimersByTime(350);
      });

      expect(screen.getByText('Enchanteur Romantic Perfumed Talcum Powder for Women')).toBeInTheDocument();
      expect(screen.getByText('Himalaya Baby Powder')).toBeInTheDocument();
    });

    it('filters displayed product cards when dynamic Gender filter is applied', () => {
      render(
        <SearchPage
          items={mockItems}
          onClose={vi.fn()}
          onQuickAdd={vi.fn()}
        />
      );

      const input = screen.getByPlaceholderText('Search "Maggi", "Milk"…');
      fireEvent.change(input, { target: { value: 'powder' } });

      act(() => {
        vi.advanceTimersByTime(350);
      });

      // Both products should be visible initially
      expect(screen.getByText('Enchanteur Romantic Perfumed Talcum Powder for Women')).toBeInTheDocument();
      expect(screen.getByText('Himalaya Baby Powder')).toBeInTheDocument();

      // Click Gender filter pill
      const genderBtn = screen.getByText('Gender').closest('button');
      fireEvent.click(genderBtn);

      // Select "Baby" gender option
      const dropdown = document.querySelector('.pio-dropdown-card');
      const babyOption = within(dropdown).getByText('Baby');
      fireEvent.click(babyOption);

      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Now only Himalaya Baby Powder should be visible
      expect(screen.getByText('Himalaya Baby Powder')).toBeInTheDocument();
      expect(screen.queryByText('Enchanteur Romantic Perfumed Talcum Powder for Women')).not.toBeInTheDocument();
    });

    it('resets filter selections when "Clear all" is clicked', () => {
      render(
        <SearchPage
          items={mockItems}
          onClose={vi.fn()}
          onQuickAdd={vi.fn()}
        />
      );

      const input = screen.getByPlaceholderText('Search "Maggi", "Milk"…');
      fireEvent.change(input, { target: { value: 'powder' } });

      act(() => {
        vi.advanceTimersByTime(350);
      });

      // Filter to Baby
      fireEvent.click(screen.getByText('Gender').closest('button'));
      const dropdown = document.querySelector('.pio-dropdown-card');
      const babyOption = within(dropdown).getByText('Baby');
      fireEvent.click(babyOption);

      act(() => {
        vi.advanceTimersByTime(50);
      });

      // Click "Clear all" button
      const clearAllBtn = screen.getByText('Clear all');
      fireEvent.click(clearAllBtn);

      act(() => {
        vi.advanceTimersByTime(50);
      });

      // Both products should be visible again
      expect(screen.getByText('Enchanteur Romantic Perfumed Talcum Powder for Women')).toBeInTheDocument();
      expect(screen.getByText('Himalaya Baby Powder')).toBeInTheDocument();
    });
  });

  describe('Tier 3: Quick Add to Cart & Floating Cart Interaction', () => {
    it('clicking [ ADD ] on a product card calls onQuickAdd with product data', () => {
      const handleQuickAdd = vi.fn();
      render(
        <SearchPage
          items={mockItems}
          onClose={vi.fn()}
          onQuickAdd={handleQuickAdd}
        />
      );

      const input = screen.getByPlaceholderText('Search "Maggi", "Milk"…');
      fireEvent.change(input, { target: { value: 'milk' } });

      act(() => {
        vi.advanceTimersByTime(350);
      });

      const addBtn = screen.getByRole('button', { name: 'ADD' });
      fireEvent.click(addBtn);

      expect(handleQuickAdd).toHaveBeenCalledTimes(1);
      expect(handleQuickAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Amul Taaza Homogenised Toned Milk',
          sellingPrice: 72,
        })
      );
    });

    it('displays floating cart bar with total items and amount when cart has items', () => {
      const mockCart = [
        {
          _id: 'prod_3',
          name: 'Amul Taaza Homogenised Toned Milk',
          sellingPrice: 72,
          qty: 2,
        },
      ];

      render(
        <SearchPage
          items={mockItems}
          cart={mockCart}
          onClose={vi.fn()}
          onQuickAdd={vi.fn()}
          onViewCart={vi.fn()}
        />
      );

      expect(screen.getByText('2 items')).toBeInTheDocument();
      expect(screen.getByText('₹144.00')).toBeInTheDocument();
      expect(screen.getByText('View Cart ▶')).toBeInTheDocument();
    });

    it('clicking floating cart bar invokes onViewCart and onClose', () => {
      const handleClose = vi.fn();
      const handleViewCart = vi.fn();

      const mockCart = [
        {
          _id: 'prod_3',
          name: 'Amul Taaza Homogenised Toned Milk',
          sellingPrice: 72,
          qty: 1,
        },
      ];

      render(
        <SearchPage
          items={mockItems}
          cart={mockCart}
          onClose={handleClose}
          onQuickAdd={vi.fn()}
          onViewCart={handleViewCart}
        />
      );

      const cartBar = screen.getByText('View Cart ▶').closest('div');
      fireEvent.click(cartBar);

      expect(handleClose).toHaveBeenCalledTimes(1);
      expect(handleViewCart).toHaveBeenCalledTimes(1);
    });
  });

  describe('Tier 4: Cross-Feature Scenarios & Resilience', () => {
    it('consolidates multi-variant items into single card with interactive variant switcher', () => {
      render(
        <SearchPage
          items={mockItems}
          onClose={vi.fn()}
          onQuickAdd={vi.fn()}
        />
      );

      const input = screen.getByPlaceholderText('Search "Maggi", "Milk"…');
      fireEvent.change(input, { target: { value: 'enchanteur' } });

      act(() => {
        vi.advanceTimersByTime(350);
      });

      // Exactly 1 card for Enchanteur
      const titles = screen.getAllByText('Enchanteur Romantic Perfumed Talcum Powder for Women');
      expect(titles).toHaveLength(1);

      // Card has variant selector [ 125 g ▾ ]
      const variantBtn = screen.getByText('125 g').closest('button');
      expect(variantBtn).toBeInTheDocument();
      expect(variantBtn.textContent).toContain('▾');
    });

    it('displays zero-results view when searching for non-existent item', () => {
      render(
        <SearchPage
          items={mockItems}
          onClose={vi.fn()}
          onQuickAdd={vi.fn()}
        />
      );

      const input = screen.getByPlaceholderText('Search "Maggi", "Milk"…');
      fireEvent.change(input, { target: { value: 'xyznonexistentterm' } });

      act(() => {
        vi.advanceTimersByTime(350);
      });

      expect(screen.getByText(/No products for "xyznonexistentterm"/i)).toBeInTheDocument();
    });

    it('back button (←) calls onClose', () => {
      const handleClose = vi.fn();
      render(
        <SearchPage
          items={mockItems}
          onClose={handleClose}
          onQuickAdd={vi.fn()}
        />
      );

      const backBtn = screen.getByText('←');
      fireEvent.click(backBtn);

      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('translates Devanagari query (दूध) to milk search results', () => {
      render(
        <SearchPage
          items={mockItems}
          onClose={vi.fn()}
          onQuickAdd={vi.fn()}
        />
      );

      const input = screen.getByPlaceholderText('Search "Maggi", "Milk"…');
      fireEvent.change(input, { target: { value: 'दूध' } });

      act(() => {
        vi.advanceTimersByTime(350);
      });

      expect(screen.getByText('Amul Taaza Homogenised Toned Milk')).toBeInTheDocument();
    });
  });
});

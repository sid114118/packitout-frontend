import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import EnhancedProductCard from '../components/search/EnhancedProductCard.jsx';

describe('EnhancedProductCard Tests', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const singleVariantProduct = {
    _id: 'prod_single_1',
    name: 'Ponds Magic Freshness Talcum Powder',
    brand: 'Ponds',
    category: 'Beauty & Grooming',
    subCategory: 'Deodorants & Fragrances',
    qnty: '100 g',
    sellingPrice: 140,
    mrp: 140,
    image: 'https://example.com/ponds.jpg',
    attributes: { gender: 'Unisex' },
  };

  const multiVariantProduct = {
    _id: 'prod_multi_1',
    itemGroupId: 'enchanteur_romantic_talc',
    name: 'Enchanteur Romantic Perfumed Talcum Powder for Women',
    brand: 'Enchanteur',
    category: 'Beauty & Grooming',
    subCategory: 'Deodorants & Fragrances',
    qnty: '125 g',
    mrp: 185,
    sellingPrice: 148,
    isMultiVariant: true,
    attributes: { gender: 'Women' },
    image: 'https://example.com/enchanteur.jpg',
    variants: [
      {
        _id: 'var_125g',
        qnty: '125 g',
        mrp: 185,
        sellingPrice: 148,
        unitPriceDisplay: '₹118/100 g',
        inStock: true,
      },
      {
        _id: 'var_250g',
        qnty: '250 g',
        mrp: 320,
        sellingPrice: 260,
        unitPriceDisplay: '₹104/100 g',
        inStock: true,
      },
      {
        _id: 'var_500g',
        qnty: '500 g',
        mrp: 590,
        sellingPrice: 470,
        unitPriceDisplay: '₹94/100 g',
        inStock: true,
      },
    ],
  };

  const riceProduct = {
    _id: 'prod_rice_1',
    name: 'India Gate Feast Rozzana Basmati Rice',
    brand: 'India Gate',
    category: 'Atta, Rice & Dal',
    qnty: '1 kg',
    mrp: 199,
    sellingPrice: 171,
    image: 'https://example.com/indiagate.jpg',
    attributes: { grainType: 'Basmati' },
    isVeg: true,
  };

  describe('Tier 1: Product Card Rendering & Unit Pricing Display', () => {
    it('renders basic product info: name, brand, image, and price', () => {
      render(
        <EnhancedProductCard
          item={singleVariantProduct}
          cart={[]}
          onQuickAdd={vi.fn()}
          onRemoveFromCart={vi.fn()}
          onOpenDetails={vi.fn()}
        />
      );

      expect(screen.getByText('Ponds Magic Freshness Talcum Powder')).toBeInTheDocument();
      expect(screen.getByText('₹140')).toBeInTheDocument();
      const img = screen.getByAltText('Ponds Magic Freshness Talcum Powder');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', singleVariantProduct.image);
    });

    it('calculates and renders unit pricing line for 125g at ₹148 to ₹118/100 g', () => {
      render(
        <EnhancedProductCard
          item={multiVariantProduct}
          cart={[]}
          onQuickAdd={vi.fn()}
          onRemoveFromCart={vi.fn()}
          onOpenDetails={vi.fn()}
        />
      );

      // Unit price display for 125g variant
      expect(screen.getByText('₹118/100 g')).toBeInTheDocument();
    });

    it('calculates and renders unit pricing for 1 kg at ₹171 to ₹171/kg', () => {
      render(
        <EnhancedProductCard
          item={riceProduct}
          cart={[]}
          onQuickAdd={vi.fn()}
          onRemoveFromCart={vi.fn()}
          onOpenDetails={vi.fn()}
        />
      );

      expect(screen.getByText('₹171/kg')).toBeInTheDocument();
    });

    it('displays struck-through MRP and blue discount badge when mrp > sellingPrice', () => {
      render(
        <EnhancedProductCard
          item={multiVariantProduct}
          cart={[]}
          onQuickAdd={vi.fn()}
          onRemoveFromCart={vi.fn()}
          onOpenDetails={vi.fn()}
        />
      );

      expect(screen.getByText('₹185')).toBeInTheDocument();
      expect(screen.getByText(/20% OFF/i)).toBeInTheDocument();
    });

    it('does not display struck-through MRP or discount badge when mrp equals sellingPrice', () => {
      render(
        <EnhancedProductCard
          item={singleVariantProduct}
          cart={[]}
          onQuickAdd={vi.fn()}
          onRemoveFromCart={vi.fn()}
          onOpenDetails={vi.fn()}
        />
      );

      // Since sellingPrice === mrp (140), there should be only one ₹140 text and no % OFF
      expect(screen.queryByText(/% OFF/i)).not.toBeInTheDocument();
    });

    it('renders single-variant quantity badge without dropdown arrow', () => {
      render(
        <EnhancedProductCard
          item={singleVariantProduct}
          cart={[]}
          onQuickAdd={vi.fn()}
          onRemoveFromCart={vi.fn()}
          onOpenDetails={vi.fn()}
        />
      );

      const qtyBtn = screen.getByText('100 g').closest('button');
      expect(qtyBtn).toBeInTheDocument();
      // Dropdown arrow ▾ should not exist inside this button
      expect(qtyBtn.textContent).not.toContain('▾');
    });

    it('triggers onOpenDetails callback when clicking on card body', () => {
      const handleOpenDetails = vi.fn();
      const { container } = render(
        <EnhancedProductCard
          item={singleVariantProduct}
          cart={[]}
          onQuickAdd={vi.fn()}
          onRemoveFromCart={vi.fn()}
          onOpenDetails={handleOpenDetails}
        />
      );

      fireEvent.click(container.firstChild);
      expect(handleOpenDetails).toHaveBeenCalledTimes(1);
      expect(handleOpenDetails).toHaveBeenCalledWith(singleVariantProduct);
    });
  });

  describe('Tier 2: Interactive Variant Selector & Switching', () => {
    it('renders interactive variant selector [ 125 g ▾ ] for multi-variant product', () => {
      render(
        <EnhancedProductCard
          item={multiVariantProduct}
          cart={[]}
          onQuickAdd={vi.fn()}
          onRemoveFromCart={vi.fn()}
          onOpenDetails={vi.fn()}
        />
      );

      const variantBtn = screen.getByText('125 g').closest('button');
      expect(variantBtn).toBeInTheDocument();
      expect(variantBtn.textContent).toContain('▾');
    });

    it('opens variant dropdown when clicking variant button, displaying all sizes and prices', () => {
      render(
        <EnhancedProductCard
          item={multiVariantProduct}
          cart={[]}
          onQuickAdd={vi.fn()}
          onRemoveFromCart={vi.fn()}
          onOpenDetails={vi.fn()}
        />
      );

      const variantBtn = screen.getByText('125 g').closest('button');
      fireEvent.click(variantBtn);

      // Should show 250 g and 500 g options in dropdown
      expect(screen.getByText('250 g')).toBeInTheDocument();
      expect(screen.getByText('₹260')).toBeInTheDocument();
      expect(screen.getByText('500 g')).toBeInTheDocument();
      expect(screen.getByText('₹470')).toBeInTheDocument();
    });

    it('updates selling price, struck MRP, discount badge, and unit price upon selecting another variant', () => {
      render(
        <EnhancedProductCard
          item={multiVariantProduct}
          cart={[]}
          onQuickAdd={vi.fn()}
          onRemoveFromCart={vi.fn()}
          onOpenDetails={vi.fn()}
        />
      );

      // Initial state: 125 g, ₹148, ₹118/100 g
      expect(screen.getByText('₹148')).toBeInTheDocument();
      expect(screen.getByText('₹118/100 g')).toBeInTheDocument();

      // Open dropdown
      const variantBtn = screen.getByText('125 g').closest('button');
      fireEvent.click(variantBtn);

      // Select 250 g variant
      const option250g = screen.getByText('250 g');
      fireEvent.click(option250g);

      // New state: 250 g, ₹260, ₹320 struck MRP, unit price ₹104/100 g
      expect(screen.getByText('250 g').closest('button')).toBeInTheDocument();
      expect(screen.getByText('₹260')).toBeInTheDocument();
      expect(screen.getByText('₹320')).toBeInTheDocument();
      expect(screen.getByText('₹104/100 g')).toBeInTheDocument();

      // Dropdown should be closed
      expect(screen.queryByText('500 g')).not.toBeInTheDocument();
    });

    it('clicking variant selector or option does not trigger onOpenDetails', () => {
      const handleOpenDetails = vi.fn();
      render(
        <EnhancedProductCard
          item={multiVariantProduct}
          cart={[]}
          onQuickAdd={vi.fn()}
          onRemoveFromCart={vi.fn()}
          onOpenDetails={handleOpenDetails}
        />
      );

      const variantBtn = screen.getByText('125 g').closest('button');
      fireEvent.click(variantBtn);

      expect(handleOpenDetails).not.toHaveBeenCalled();

      const option250g = screen.getByText('250 g');
      fireEvent.click(option250g);

      expect(handleOpenDetails).not.toHaveBeenCalled();
    });

    it('closes variant dropdown when clicking outside', () => {
      render(
        <div>
          <div data-testid="outside">Outside</div>
          <EnhancedProductCard
            item={multiVariantProduct}
            cart={[]}
            onQuickAdd={vi.fn()}
            onRemoveFromCart={vi.fn()}
            onOpenDetails={vi.fn()}
          />
        </div>
      );

      // Open dropdown
      fireEvent.click(screen.getByText('125 g').closest('button'));
      expect(screen.getByText('250 g')).toBeInTheDocument();

      // Click outside
      fireEvent.pointerDown(screen.getByTestId('outside'));
      expect(screen.queryByText('250 g')).not.toBeInTheDocument();
    });
  });

  describe('Tier 3: Emerald Green ADD Button & Stepper Interactions', () => {
    it('renders emerald green ADD button when item is not in cart', () => {
      render(
        <EnhancedProductCard
          item={singleVariantProduct}
          cart={[]}
          onQuickAdd={vi.fn()}
          onRemoveFromCart={vi.fn()}
          onOpenDetails={vi.fn()}
        />
      );

      const addBtn = screen.getByRole('button', { name: 'ADD' });
      expect(addBtn).toBeInTheDocument();
      expect(addBtn).toHaveClass('pio-add-btn');
    });

    it('clicking ADD button calls onQuickAdd with active variant data without bubbling', () => {
      const handleQuickAdd = vi.fn();
      const handleOpenDetails = vi.fn();

      render(
        <EnhancedProductCard
          item={multiVariantProduct}
          cart={[]}
          onQuickAdd={handleQuickAdd}
          onRemoveFromCart={vi.fn()}
          onOpenDetails={handleOpenDetails}
        />
      );

      const addBtn = screen.getByRole('button', { name: 'ADD' });
      fireEvent.click(addBtn);

      expect(handleQuickAdd).toHaveBeenCalledTimes(1);
      expect(handleQuickAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: 'var_125g',
          sellingPrice: 148,
          mrp: 185,
          qnty: '125 g',
        })
      );
      expect(handleOpenDetails).not.toHaveBeenCalled();
    });

    it('transforms into [ − qty + ] stepper when cart has item', () => {
      const cart = [
        {
          _id: 'prod_single_1',
          name: 'Ponds Magic Freshness Talcum Powder',
          qnty: '100 g',
          qty: 2,
        },
      ];

      render(
        <EnhancedProductCard
          item={singleVariantProduct}
          cart={cart}
          onQuickAdd={vi.fn()}
          onRemoveFromCart={vi.fn()}
          onOpenDetails={vi.fn()}
        />
      );

      expect(screen.queryByRole('button', { name: 'ADD' })).not.toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Increase quantity' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Decrease quantity' })).toBeInTheDocument();
    });

    it('clicking + and − buttons in stepper invokes onQuickAdd and onRemoveFromCart', () => {
      const handleQuickAdd = vi.fn();
      const handleRemove = vi.fn();
      const handleOpenDetails = vi.fn();

      const cart = [
        {
          _id: 'prod_single_1',
          name: 'Ponds Magic Freshness Talcum Powder',
          qnty: '100 g',
          qty: 1,
        },
      ];

      render(
        <EnhancedProductCard
          item={singleVariantProduct}
          cart={cart}
          onQuickAdd={handleQuickAdd}
          onRemoveFromCart={handleRemove}
          onOpenDetails={handleOpenDetails}
        />
      );

      const incBtn = screen.getByRole('button', { name: 'Increase quantity' });
      fireEvent.click(incBtn);
      expect(handleQuickAdd).toHaveBeenCalledTimes(1);
      expect(handleOpenDetails).not.toHaveBeenCalled();

      const decBtn = screen.getByRole('button', { name: 'Decrease quantity' });
      fireEvent.click(decBtn);
      expect(handleRemove).toHaveBeenCalledTimes(1);
      expect(handleOpenDetails).not.toHaveBeenCalled();
    });
  });

  describe('Tier 4: Wishlist, Carousel Dots, Badges & Resilient Rendering', () => {
    it('toggles wishlist heart button fill and color without bubbling to card', () => {
      const handleOpenDetails = vi.fn();
      render(
        <EnhancedProductCard
          item={singleVariantProduct}
          cart={[]}
          onQuickAdd={vi.fn()}
          onRemoveFromCart={vi.fn()}
          onOpenDetails={handleOpenDetails}
        />
      );

      const heartBtn = screen.getByRole('button', { name: 'Wishlist' });
      expect(heartBtn).toHaveStyle({ color: '#64748b' });

      // Click to wishlist
      fireEvent.click(heartBtn);
      expect(heartBtn).toHaveStyle({ color: '#ef4444' });
      expect(handleOpenDetails).not.toHaveBeenCalled();

      // Click again to un-wishlist
      fireEvent.click(heartBtn);
      expect(heartBtn).toHaveStyle({ color: '#64748b' });
    });

    it('renders attribute tags (e.g. Women, Strong, Veg)', () => {
      render(
        <EnhancedProductCard
          item={multiVariantProduct}
          cart={[]}
          onQuickAdd={vi.fn()}
          onRemoveFromCart={vi.fn()}
          onOpenDetails={vi.fn()}
        />
      );

      expect(screen.getByText('Women')).toBeInTheDocument();
      expect(screen.getByText('Strong')).toBeInTheDocument();
    });

    it('falls back to default image on image onError', () => {
      render(
        <EnhancedProductCard
          item={singleVariantProduct}
          cart={[]}
          onQuickAdd={vi.fn()}
          onRemoveFromCart={vi.fn()}
          onOpenDetails={vi.fn()}
        />
      );

      const img = screen.getByAltText(singleVariantProduct.name);
      fireEvent.error(img);
      expect(img.src).toContain('cloudinary.com');
    });

    it('safely handles null item without crashing', () => {
      const { container } = render(
        <EnhancedProductCard
          item={null}
          cart={[]}
          onQuickAdd={vi.fn()}
          onRemoveFromCart={vi.fn()}
          onOpenDetails={vi.fn()}
        />
      );

      expect(container.firstChild).toBeNull();
    });
  });
});

import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import SearchAutocompleteOverlay from '../components/search/SearchAutocompleteOverlay.jsx';

describe('SearchAutocompleteOverlay Tests', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const mockSuggestions = [
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
    {
      id: 'sub_talcum_powder',
      text: 'Talcum powder',
      category: 'Beauty & Grooming',
      subCategory: 'Deodorants & Fragrances',
      type: 'subCategory',
      thumbnail: 'https://res.cloudinary.com/dj48tkcsw/image/upload/v1775368062/Products/Amul/kp5mli0uneidjzg4ytmm.webp',
    },
  ];

  describe('Tier 1: Primary Happy Path & Suggestion Rendering', () => {
    it('renders suggestions overlay when isOpen is true and suggestions exist', () => {
      render(
        <SearchAutocompleteOverlay
          isOpen={true}
          query="powder"
          suggestions={mockSuggestions}
          onSelectSuggestion={vi.fn()}
          onClose={vi.fn()}
        />
      );

      const items = screen.getAllByRole('button');
      expect(items).toHaveLength(3);
    });

    it('renders category thumbnail images with correct src and alt attributes', () => {
      render(
        <SearchAutocompleteOverlay
          isOpen={true}
          query="powder"
          suggestions={mockSuggestions}
          onSelectSuggestion={vi.fn()}
          onClose={vi.fn()}
        />
      );

      const faceImg = screen.getByAltText('Face powder');
      expect(faceImg).toBeInTheDocument();
      expect(faceImg).toHaveAttribute('src', mockSuggestions[1].thumbnail);

      const talcImg = screen.getByAltText('Talcum powder');
      expect(talcImg).toBeInTheDocument();
      expect(talcImg).toHaveAttribute('src', mockSuggestions[2].thumbnail);
    });

    it('renders differentiator bold text for prefix difference (e.g. "Face powder" with query "powder")', () => {
      const { container } = render(
        <SearchAutocompleteOverlay
          isOpen={true}
          query="powder"
          suggestions={mockSuggestions}
          onSelectSuggestion={vi.fn()}
          onClose={vi.fn()}
        />
      );

      // Find the item for "Face powder"
      const strongElements = container.querySelectorAll('strong');
      const strongTexts = Array.from(strongElements).map(el => el.textContent.trim());
      expect(strongTexts).toContain('Face');
      expect(strongTexts).toContain('Talcum');
    });

    it('renders differentiator bold text for suffix difference (e.g. "Powder Puff" with query "Powder")', () => {
      const suffixSuggestion = [
        {
          id: 'item_puff',
          text: 'Powder Puff',
          category: 'Beauty & Grooming',
          thumbnail: 'https://example.com/puff.jpg',
        },
      ];

      const { container } = render(
        <SearchAutocompleteOverlay
          isOpen={true}
          query="Powder"
          suggestions={suffixSuggestion}
          onSelectSuggestion={vi.fn()}
          onClose={vi.fn()}
        />
      );

      const strongEl = container.querySelector('strong');
      expect(strongEl).not.toBeNull();
      expect(strongEl.textContent.trim()).toBe('Puff');
    });

    it('renders category context sub-label when item.category is provided and differs from text', () => {
      render(
        <SearchAutocompleteOverlay
          isOpen={true}
          query="powder"
          suggestions={mockSuggestions}
          onSelectSuggestion={vi.fn()}
          onClose={vi.fn()}
        />
      );

      // "in Beauty & Grooming" should appear for Face powder and Talcum powder
      const subLabels = screen.getAllByText('in Beauty & Grooming');
      expect(subLabels.length).toBeGreaterThanOrEqual(1);
    });

    it('invokes onSelectSuggestion callback when a suggestion item is clicked', () => {
      const handleSelect = vi.fn();
      render(
        <SearchAutocompleteOverlay
          isOpen={true}
          query="powder"
          suggestions={mockSuggestions}
          onSelectSuggestion={handleSelect}
          onClose={vi.fn()}
        />
      );

      const facePowderBtn = screen.getByText(/Face/i).closest('[role="button"]');
      expect(facePowderBtn).not.toBeNull();
      fireEvent.click(facePowderBtn);

      expect(handleSelect).toHaveBeenCalledTimes(1);
      expect(handleSelect).toHaveBeenCalledWith(mockSuggestions[1]);
    });

    it('invokes onSelectSuggestion when Enter or Space key is pressed on a suggestion', () => {
      const handleSelect = vi.fn();
      render(
        <SearchAutocompleteOverlay
          isOpen={true}
          query="powder"
          suggestions={mockSuggestions}
          onSelectSuggestion={handleSelect}
          onClose={vi.fn()}
        />
      );

      const buttons = screen.getAllByRole('button');
      // Press Enter on first item
      fireEvent.keyDown(buttons[0], { key: 'Enter' });
      expect(handleSelect).toHaveBeenCalledWith(mockSuggestions[0]);

      // Press Space on second item
      fireEvent.keyDown(buttons[1], { key: ' ' });
      expect(handleSelect).toHaveBeenCalledWith(mockSuggestions[1]);
    });
  });

  describe('Tier 2: Boundary Conditions & Event Handling', () => {
    it('returns null when isOpen is false', () => {
      const { container } = render(
        <SearchAutocompleteOverlay
          isOpen={false}
          query="powder"
          suggestions={mockSuggestions}
          onSelectSuggestion={vi.fn()}
          onClose={vi.fn()}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('returns null when suggestions is an empty array', () => {
      const { container } = render(
        <SearchAutocompleteOverlay
          isOpen={true}
          query="powder"
          suggestions={[]}
          onSelectSuggestion={vi.fn()}
          onClose={vi.fn()}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('returns null when suggestions is null or undefined', () => {
      const { container: c1 } = render(
        <SearchAutocompleteOverlay
          isOpen={true}
          query="powder"
          suggestions={null}
          onSelectSuggestion={vi.fn()}
          onClose={vi.fn()}
        />
      );
      expect(c1.firstChild).toBeNull();

      const { container: c2 } = render(
        <SearchAutocompleteOverlay
          isOpen={true}
          query="powder"
          suggestions={undefined}
          onSelectSuggestion={vi.fn()}
          onClose={vi.fn()}
        />
      );
      expect(c2.firstChild).toBeNull();
    });

    it('falls back to search icon 🔍 when suggestion has no thumbnail', () => {
      const noThumbSuggestion = [
        {
          id: 'sub_simple',
          text: 'Baby powder',
          category: 'Baby Care',
          thumbnail: null,
        },
      ];

      render(
        <SearchAutocompleteOverlay
          isOpen={true}
          query="powder"
          suggestions={noThumbSuggestion}
          onSelectSuggestion={vi.fn()}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText('🔍')).toBeInTheDocument();
    });

    it('calls onClose when a pointerdown event occurs outside the overlay', () => {
      const handleClose = vi.fn();
      render(
        <div>
          <div data-testid="outside-area">Outside</div>
          <SearchAutocompleteOverlay
            isOpen={true}
            query="powder"
            suggestions={mockSuggestions}
            onSelectSuggestion={vi.fn()}
            onClose={handleClose}
          />
        </div>
      );

      const outsideArea = screen.getByTestId('outside-area');
      fireEvent.pointerDown(outsideArea);

      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('does NOT call onClose when a pointerdown event occurs inside the overlay', () => {
      const handleClose = vi.fn();
      const { container } = render(
        <SearchAutocompleteOverlay
          isOpen={true}
          query="powder"
          suggestions={mockSuggestions}
          onSelectSuggestion={vi.fn()}
          onClose={handleClose}
        />
      );

      const overlayElement = container.querySelector('.search-autocomplete-overlay');
      expect(overlayElement).not.toBeNull();
      fireEvent.pointerDown(overlayElement);

      expect(handleClose).not.toHaveBeenCalled();
    });

    it('replaces broken image with fallback icon when image triggers onError', () => {
      render(
        <SearchAutocompleteOverlay
          isOpen={true}
          query="powder"
          suggestions={[
            {
              id: 'broken_img',
              text: 'Broken Image Item',
              thumbnail: 'https://invalid-url-that-fails.com/test.jpg',
            },
          ]}
          onSelectSuggestion={vi.fn()}
          onClose={vi.fn()}
        />
      );

      const img = screen.getByAltText('Broken Image Item');
      const parent = img.parentElement;
      fireEvent.error(img);

      // The onError handler hides img and places '🔍' in parent element
      expect(parent.textContent).toContain('🔍');
    });
  });

  describe('Tier 3: Pairwise Contexts & Quick-Commerce Scenarios', () => {
    it('handles exact query match correctly without split issues', () => {
      const exactSuggestions = [
        {
          id: 'cat_powder_exact',
          text: 'Powder',
          category: 'Beauty & Grooming',
          thumbnail: 'https://example.com/p.jpg',
        },
      ];

      render(
        <SearchAutocompleteOverlay
          isOpen={true}
          query="Powder"
          suggestions={exactSuggestions}
          onSelectSuggestion={vi.fn()}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText('Powder')).toBeInTheDocument();
    });

    it('renders multiple grocery suggestions for "rice" query', () => {
      const riceSuggestions = [
        { id: 'rice_1', text: 'Rice', category: 'Atta, Rice & Dal', thumbnail: 'https://example.com/rice.png' },
        { id: 'rice_2', text: 'Basmati rice', category: 'Atta, Rice & Dal', thumbnail: 'https://example.com/basmati.png' },
        { id: 'rice_3', text: 'Brown rice', category: 'Atta, Rice & Dal', thumbnail: 'https://example.com/brown.png' },
      ];

      render(
        <SearchAutocompleteOverlay
          isOpen={true}
          query="rice"
          suggestions={riceSuggestions}
          onSelectSuggestion={vi.fn()}
          onClose={vi.fn()}
        />
      );

      expect(screen.getAllByRole('button')).toHaveLength(3);
      expect(screen.getByText('Basmati')).toBeInTheDocument();
      expect(screen.getByText('Brown')).toBeInTheDocument();
    });
  });

  describe('Tier 4: Adversarial & Resilient Edge Cases', () => {
    it('handles query with special regex characters safely without crashing', () => {
      render(
        <SearchAutocompleteOverlay
          isOpen={true}
          query="powder [100g] (new)*"
          suggestions={mockSuggestions}
          onSelectSuggestion={vi.fn()}
          onClose={vi.fn()}
        />
      );

      expect(screen.getAllByRole('button')).toHaveLength(3);
    });

    it('renders suggestion gracefully when item has no id property', () => {
      const itemWithoutId = [
        {
          text: 'Unidentified Powder',
          category: 'Cosmetics',
        },
      ];

      render(
        <SearchAutocompleteOverlay
          isOpen={true}
          query="powder"
          suggestions={itemWithoutId}
          onSelectSuggestion={vi.fn()}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });
});

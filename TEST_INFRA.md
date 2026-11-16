# E2E Test Infra: PackItOut Smart Search Experience

## Test Philosophy
- Opaque-box, requirement-driven testing derived strictly from `ORIGINAL_REQUEST.md` and UI reference specifications.
- Dual testing layers:
  1. Frontend Vitest + React Testing Library + jsdom for DOM interactions, rendering, and component behaviors.
  2. Backend automated test runner (`node:test` / `vitest`) for search endpoints, dynamic attribute extraction, sorting, and unit price algorithms.

## Feature Inventory & Test Coverage Goals
| # | Feature | Source (Requirement) | Tier 1 (Happy Path) | Tier 2 (Boundary & Corner) | Tier 3 (Cross-Feature Pairwise) | Tier 4 (Real-World E2E Scenarios) |
|---|---------|----------------------|:-------------------:|:--------------------------:|:-------------------------------:|:---------------------------------:|
| F1 | Autocomplete Suggestions with Thumbnails | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| F2 | Autocomplete Category Selection | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| F3 | Context-Aware Dynamic Filter Pills | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| F4 | Standard Sort & Price Range Filters | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| F5 | Filter State Synchronization | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| F6 | Unit Pricing Calculations & Display | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ | ✓ |
| F7 | Product Card Inline Variant Selector | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ | ✓ |
| F8 | Backend Search & Dynamic Attribute APIs | ORIGINAL_REQUEST §R1, §R2 | 5 | 5 | ✓ | ✓ |

## Test Architecture
- **Frontend Test Runner**: `vitest` with `jsdom` and `@testing-library/react`
  - Invocation: `npm run test:frontend` or `npx vitest run src`
  - Test suites:
    - `src/__tests__/unitPricing.test.js`: Comprehensive weight/volume unit pricing assertions (grams, kg, ml, L, pcs)
    - `src/__tests__/SearchAutocomplete.test.jsx`: Autocomplete rendering, category thumbnails, token highlights, suggestion click
    - `src/__tests__/DynamicFilterPills.test.jsx`: Dynamic pill bar, category adaptation (powder -> gender; rice -> price per kg), sort selection
    - `src/__tests__/EnhancedProductCard.test.jsx`: Unit pricing display, inline variant selector dropdown, price update on variant switch, ADD stepper
    - `src/__tests__/SearchPage.test.jsx`: Integration search flow from typing query to filtering and displaying enhanced product cards
- **Backend Test Runner**: `node:test` (Node 20 native)
  - Invocation: `npm run test:backend` or `node --test packitout-api/tests/**/*.test.js`
  - Test suites:
    - `packitout-api/tests/unitPriceCalculator.test.js`: Unit price parser and calculation verification
    - `packitout-api/tests/attributeExtractor.test.js`: Context-aware dynamic attribute extraction (gender for powder, grain type & price per kg for rice)
    - `packitout-api/tests/catalogSearchService.test.js`: Autocomplete suggestions with thumbnails, filtered search, multi-variant consolidation

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| S1 | Powder Search to Cart with Variant Selection | F1, F2, F3, F6, F7 | High |
| S2 | Rice Grocery Search with Price per kg & Brand Filtering | F1, F3, F4, F5, F6 | High |
| S3 | Sorting & Dynamic Filter Combination on Fast Browsing | F3, F4, F5, F8 | Medium |
| S4 | Single Variant vs Multi-Variant Product Card Rendering | F6, F7 | Medium |
| S5 | Empty / Boundary Query Autocomplete & Filter Fallback | F1, F2, F3, F4 | Medium |

## Coverage Thresholds
- Tier 1: ≥5 per feature (≥40 tests total)
- Tier 2: ≥5 per feature (≥40 tests total)
- Tier 3: Pairwise combination of major feature interactions (≥10 tests total)
- Tier 4: ≥5 realistic end-user application scenarios
- **Total Minimum Target**: ≥95 automated assertions across test suites

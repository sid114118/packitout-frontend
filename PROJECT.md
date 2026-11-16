# Project: PackItOut Smart Search Experience

## Architecture
- **Frontend SPA**: React 18, Vite 5, Tailwind/CSS styles in `c:\Users\888am\OneDrive\Desktop\shop`
  - Search Orchestration: `src/SearchPage.jsx`
  - Autocomplete: `src/components/search/SearchAutocompleteOverlay.jsx` with category thumbnails
  - Dynamic Filters & Sorting: `src/components/search/SearchFilterBar.jsx` & `src/utils/dynamicFilterExtractor.js`
  - Enhanced Product Cards: `src/components/search/EnhancedProductCard.jsx` with inline variant selector (`[ 200 g ▾ ]`) and unit pricing (`₹118/100 g`)
  - Unit Pricing Utility: `src/utils/unitPriceHelper.js`
  - Category Visual Assets: `src/utils/categoryThumbnailMap.js`
- **Backend API**: Node.js, Express, Mongoose in `c:\Users\888am\OneDrive\Desktop\shop\packitout-api`
  - Search Controller & Service: `packitout-api/services/catalogSearchService.js`
  - Dynamic Attribute Inference: `packitout-api/utils/attributeExtractor.js`
  - Unit Price Calculations: `packitout-api/utils/unitPriceCalculator.js`
  - Entry Point & Routes: `packitout-api/index.js`
    - `GET /catalog/autocomplete`: Autocomplete suggestions with category thumbnails
    - `GET /catalog/filters`: Dynamic context-aware filter pills (gender, brand, price per kg)
    - `GET /shops/:id/search`: Filtered, sorted, variant-consolidated catalog search with unit prices
- **Testing Infrastructure**:
  - Frontend: Vitest + @testing-library/react + jsdom in `src/__tests__/`
  - Backend: Node test runner in `packitout-api/tests/`

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Visual Autocomplete Suggestions | Typing in search displays category/type suggestions with visual thumbnails matching query | M1 & M2 | ORIGINAL_REQUEST §R1 |
| 2 | Category Selection Filtering | Selecting an autocomplete option filters results by that category/type | M2 | ORIGINAL_REQUEST §R1 |
| 3 | Dynamic Context-Aware Filter Pills | Horizontal filter bar adapts to query/category (e.g. Gender & Brand for powder, Price per kg & Brand for rice) | M1 & M2 | ORIGINAL_REQUEST §R2 |
| 4 | Standard Sort & Price Filters | Sort by price (asc/desc), discount, rating, relevance; filter by price range | M1 & M2 | ORIGINAL_REQUEST §R2 |
| 5 | Filter State Synchronization | Selecting or clearing filter pills updates the displayed product list and active pill styling | M2 | ORIGINAL_REQUEST §R2 |
| 6 | Unit Pricing Display | Product cards display normalized unit prices (e.g., ₹118/100 g, ₹171/kg) matching reference image | M1 & M2 | ORIGINAL_REQUEST §R3 |
| 7 | In-Card Interactive Variant Selector | Product cards with multiple variants provide an interactive selector (e.g. `[ 200 g ▾ ]`) to choose size/options | M2 | ORIGINAL_REQUEST §R3 |
| 8 | Backend Dynamic Attribute & Autocomplete APIs | Server-side endpoints for autocomplete thumbnails, dynamic facet extraction, and sorted/filtered search | M1 | ORIGINAL_REQUEST §R1, §R2 |
| 9 | Automated Test Suite (Tiers 1-4) | Comprehensive frontend and backend automated test coverage with clean execution | M3 | ORIGINAL_REQUEST Verification |
| 10 | Technical Overview Walkthrough | Detailed technical walkthrough documenting components, APIs, and dynamic filtering logic | M4 | ORIGINAL_REQUEST §R4 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Backend Search, Autocomplete & Attribute Extraction API | `packitout-api/utils/unitPriceCalculator.js`, `attributeExtractor.js`, `catalogSearchService.js`, `index.js` routes | None | DONE |
| M2 | Frontend Smart Search, Dynamic Filter Bar & Enhanced Product Cards | `unitPriceHelper.js`, `categoryThumbnailMap.js`, `dynamicFilterExtractor.js`, `SearchAutocompleteOverlay.jsx`, `SearchFilterBar.jsx`, `EnhancedProductCard.jsx`, `SearchPage.jsx` | M1 interface contracts | DONE |
| M3 | E2E & Automated Test Suite (Tiers 1-4) | Frontend Vitest/RTL tests + Backend test suite publishing `TEST_READY.md` | Requirements / M1 & M2 contracts | DONE |
| M4 | Verification Wave & Technical Walkthrough | Reviewers, Challengers, Forensic Auditor verification + comprehensive Technical Overview report | M1, M2, M3 | DONE |

## Interface Contracts

### 1. `GET /catalog/autocomplete`
- **Query**: `q` (string, required), `shopId` (string, optional), `limit` (number, default: 8)
- **Response**:
  ```json
  {
    "query": "powder",
    "suggestions": [
      {
        "id": "cat_powder",
        "text": "Powder",
        "type": "category",
        "category": "Beauty & Grooming",
        "subCategory": "Deodorants & Fragrances",
        "thumbnail": "https://...",
        "itemCount": 253
      },
      {
        "id": "sub_face_powder",
        "text": "Face powder",
        "type": "subCategory",
        "category": "Beauty & Grooming",
        "subCategory": "Makeup & Cosmetics",
        "thumbnail": "https://...",
        "itemCount": 7
      }
    ]
  }
  ```

### 2. `GET /catalog/filters`
- **Query**: `q` (string, optional), `category` (string, optional), `subCategory` (string, optional), `shopId` (string, optional)
- **Response**:
  ```json
  {
    "query": "powder",
    "category": "Beauty & Grooming",
    "sortOptions": [
      { "id": "relevance", "label": "Relevance" },
      { "id": "price_asc", "label": "Price: Low to High" },
      { "id": "price_desc", "label": "Price: High to Low" },
      { "id": "discount_desc", "label": "Discount: High to Low" },
      { "id": "rating_desc", "label": "Customer Rating" }
    ],
    "priceRange": { "min": 15, "max": 475 },
    "filterPills": [
      {
        "key": "gender",
        "label": "Gender",
        "type": "single_select",
        "options": [
          { "value": "Women", "label": "Women", "count": 18 },
          { "value": "Men", "label": "Men", "count": 12 },
          { "value": "Baby", "label": "Baby", "count": 32 },
          { "value": "Unisex", "label": "Unisex", "count": 32 }
        ]
      },
      {
        "key": "brand",
        "label": "Brand",
        "type": "multi_select",
        "options": [...]
      }
    ]
  }
  ```

### 3. `GET /shops/:id/search`
- **Query**: `q`, `category`, `subCategory`, `brand`, `gender`, `grainType`, `minPrice`, `maxPrice`, `sort` (`relevance` | `price_asc` | `price_desc` | `discount_desc` | `rating_desc`), `page`, `limit`
- **Item Response**:
  ```json
  {
    "_id": "...",
    "name": "Enchanteur Romantic Perfumed Talcum Powder for Women",
    "brand": "Enchanteur",
    "category": "Beauty & Grooming",
    "subCategory": "Deodorants & Fragrances",
    "qnty": "125 g",
    "mrp": 185,
    "sellingPrice": 148,
    "discountPercent": 20,
    "unitPrice": 118,
    "unitMeasure": "100 g",
    "unitPriceDisplay": "₹118/100 g",
    "attributes": { "gender": "Women" },
    "image": "https://...",
    "itemGroupId": "enchanteur_romantic_talc",
    "isMultiVariant": true,
    "variants": [
      {
        "_id": "...",
        "qnty": "125 g",
        "mrp": 185,
        "sellingPrice": 148,
        "unitPriceDisplay": "₹118/100 g",
        "inStock": true
      },
      {
        "_id": "...",
        "qnty": "250 g",
        "mrp": 320,
        "sellingPrice": 260,
        "unitPriceDisplay": "₹104/100 g",
        "inStock": true
      }
    ]
  }
  ```

## Code Layout
- Frontend components: `src/components/search/`
- Frontend utilities: `src/utils/`
- Frontend tests: `src/__tests__/`
- Backend services & utils: `packitout-api/services/`, `packitout-api/utils/`
- Backend tests: `packitout-api/tests/`
- Documentation & walkthrough: `PROJECT.md`, `TEST_INFRA.md`, `TEST_READY.md`, `TECHNICAL_OVERVIEW.md`

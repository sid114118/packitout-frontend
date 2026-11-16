# Technical Overview Walkthrough: PackItOut Smart Search Experience

**Project**: PackItOut Quick-Commerce Catalog Search & Discovery  
**Author**: Project Orchestration Team  
**Date**: November 16, 2026  
**Status**: COMPLETE (Verified & Audited)  
**Gate Result**: **PASS** (5/5 Independent Verifiers Approved, Clean Forensic Audit)

---

## 1. Executive Summary

This document presents a comprehensive technical overview and architecture walkthrough of the production-grade **Smart Search Experience** implemented in the PackItOut web application. The solution delivers a high-speed, intuitive, and visually enriched quick-commerce discovery interface modeled after industry benchmarks (Zepto, Blinkit).

### Requirements Traceability Matrix

| Requirement | Description | Key Modules | Status |
|-------------|-------------|-------------|:------:|
| **R1. Smart Search Autocomplete** | Visual autocomplete suggestions showing item category/type accompanied by category thumbnails; selecting an option filters results. | `SearchAutocompleteOverlay.jsx`, `categoryThumbnailMap.js`, `GET /catalog/autocomplete`, `catalogSearchService.js` | **DONE** |
| **R2. Context-Aware Dynamic Filters & Sorting** | Horizontal scrolling filter bar dynamically adapting facets (e.g. Gender/Brand for cosmetics/powder; Price per kg/Grain Type/Brand for grocery/rice) with sort/price options. | `SearchFilterBar.jsx`, `dynamicFilterExtractor.js`, `GET /catalog/filters`, `attributeExtractor.js` | **DONE** |
| **R3. Enhanced Product Cards & Unit Pricing** | Enhanced cards featuring normalized unit pricing (e.g. `₹118/100 g`, `₹171/kg`), interactive inline variant badge (`[ 200 g ▾ ]`), and cart stepper synchronization. | `EnhancedProductCard.jsx`, `unitPriceHelper.js`, `unitPriceCalculator.js`, `GET /shops/:id/search` | **DONE** |
| **R4. Technical Walkthrough & Verification** | End-to-end technical documentation and automated test suites (Tiers 1-4) with clean passing verification. | `TEST_INFRA.md`, `TEST_READY.md`, `TECHNICAL_OVERVIEW.md`, 140 automated tests | **DONE** |

---

## 2. System Architecture

The smart search subsystem is built on a resilient **hybrid client-server architecture**. Client-side utilities provide zero-latency (<5ms) reactive updates for instant user feedback, while backend microservices provide scalable indexing, heavy facet extraction, and variant consolidation for catalogs of 10,000+ items.

```
┌────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (SPA)                            │
│                                                                        │
│  ┌─────────────────────── SearchPage.jsx ───────────────────────────┐  │
│  │                                                                  │  │
│  │   [ 🔍 Search Input ] ─────── debounced input (300ms)            │  │
│  │           │                                                      │  │
│  │           ▼                                                      │  │
│  │  SearchAutocompleteOverlay.jsx ◄─── categoryThumbnailMap.js      │  │
│  │    (Thumbnails + Bold Differentiator Text)                       │  │
│  │                                                                  │  │
│  │   [ Filter & Sort Bar ]                                          │  │
│  │  SearchFilterBar.jsx ◄───────────── dynamicFilterExtractor.js    │  │
│  │    ([Filters], [Sort], [Price], [Gender ▾], [Price/kg ▾])        │  │
│  │                                                                  │  │
│  │   [ Results Grid ]                                               │  │
│  │  EnhancedProductCard.jsx ◄───────── unitPriceHelper.js           │  │
│  │    (₹118/100 g, [ 200 g ▾ ] Variant Badge, Emerald [ ADD ])      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / JSON
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          BACKEND API (Express)                         │
│                                                                        │
│   GET /catalog/autocomplete ───────► catalogSearchService.js           │
│   GET /catalog/filters      ───────► attributeExtractor.js             │
│   GET /shops/:id/search     ───────► unitPriceCalculator.js            │
│                                                                        │
│   MongoDB / MasterProduct / Shop Inventory Collections                 │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Frontend Component Architecture

### 3.1. `SearchAutocompleteOverlay.jsx`
*File location: `src/components/search/SearchAutocompleteOverlay.jsx`*

- **Purpose**: Floating overlay anchored below the search bar that appears when the user types a query.
- **Visual Design**: Renders category thumbnail previews (44×44px with rounded borders) on the left, primary text with bold differentiators, category context sub-labels (e.g. *"in Beauty & Grooming"*), and a navigation chevron.
- **Bold Differentiator Algorithm**: Uses `formatSuggestionText(suggestionText, query)` from `categoryThumbnailMap.js` to intelligently highlight text:
  - `prefix_bold`: Query matches prefix (e.g., query `"powder"` against `"Powder face"` -> **Powder** face).
  - `suffix_bold`: Query matches suffix (e.g., query `"powder"` against `"Talcum powder"` -> Talcum **powder**).
  - `substring`: Middle-match token differentiation.
- **Event Handling & Isolation**:
  - `pointerdown` document listener closes the overlay when tapping outside the container.
  - Keyboard accessibility: Enter and Space keys trigger `onSelectSuggestion(item)`.
  - Image fallback: `onError` handler gracefully falls back to a clean magnifier icon (`🔍`) if CDN assets fail.

### 3.2. `SearchFilterBar.jsx`
*File location: `src/components/search/SearchFilterBar.jsx`*

- **Purpose**: Horizontally scrollable pill bar pinned below the search input on the results page.
- **Component Layout**:
  1. `[ 🎛 Filters ▾ ]`: Shows total active filter count badge (`18px` emerald badge). Opens the full-drawer modal with all available facets.
  2. `[ ↑↓ Sort ▾ ]`: Displays current sort option (`Relevance`, `Price: Low to High`, `Price: High to Low`, `Discount: High to Low`, `Customer Rating`).
  3. `[ Price ▾ ]`: Price range selector (`Under ₹100`, `₹100 - ₹200`, `₹200 - ₹500`, `Above ₹500`).
  4. **Dynamic Context-Aware Pills**: Injected based on active catalog facets:
     - For powder/cosmetics: `[ Gender ▾ ]` (`Women`, `Men`, `Baby`, `Unisex`), `[ Brand ▾ ]`, `[ Price per 100g ▾ ]`.
     - For grocery/rice: `[ Grain Type ▾ ]` (`Basmati`, `Daily Rice`, `Brown Rice`), `[ Brand ▾ ]`, `[ Price per kg ▾ ]`.
  5. `Clear all`: Red text action button appearing whenever any filter or non-default sort is active.
- **State Management**:
  - Independent popovers with click-outside dismissal via `useRef` and `pointerdown` listeners.
  - Single-select pills toggle values on/off; multi-select pills (e.g. Brand) support array mutations with an "Apply" action button.

### 3.3. `EnhancedProductCard.jsx`
*File location: `src/components/search/EnhancedProductCard.jsx`*

- **Purpose**: Quick-commerce product card adhering to the Zepto/Blinkit UI reference specifications.
- **Key Features**:
  1. **Image Container**: Responsive square ratio (`paddingTop: '92%'`), Wishlist heart toggle (`♡` / `❤️`), carousel indicator dots, and delivery ETA (`⏱ 22 mins`).
  2. **Inline Variant Selector Badge (`[ 200 g ▾ ]`)**:
     - Positioned directly beside the emerald `[ ADD ]` button.
     - Single-variant items render a clean static badge without a chevron.
     - Multi-variant items render an interactive badge that opens a localized dropdown on the card.
     - Selecting a variant immediately recalculates selling price, struck-through MRP, discount percentage, and unit price in place.
  3. **Standardized Unit Pricing**: Rendered prominently above the selling price (e.g. `₹118/100 g`, `₹171/kg`).
  4. **Pricing Block**: Bold selling price (`₹148`), struck MRP (`₹185`), and distinct sky-blue discount badge (`20% OFF on MRP`).
  5. **Action Controls**:
     - Emerald green `[ ADD ]` button (`#16a34a`) with 1.5px border and hover/press animations.
     - Transitions into an emerald stepper `[ − qty + ]` when the active variant is in the shopping cart.
     - Complete click event bubbling isolation (`e.stopPropagation()`) prevents opening the full product details modal when modifying cart quantities.
  6. **Metadata**: 2-line clamped product name, attribute benefit pills (e.g. `Dryness`, `Strong`), gold star rating (`★ 4.3`), review count (`(1,240)`), and scarcity warnings (`2 left`).

### 3.4. `SearchPage.jsx`
*File location: `src/SearchPage.jsx`*

- **Integration Hub**: Coordinates search state, debouncing (300ms), history management, analytics, and responsive rendering.
- **Hybrid Search Engine**:
  - Instant local search using `Fuse.js` (capped at 2,500 index pool to prevent main-thread UI jank) plus multi-token regex fallback for catalog items.
  - Asynchronous background synchronization with `GET /shops/:id/search` and `GET /catalog/filters` for full-catalog completeness.
- **Voice Search & Devanagari Translation**:
  - Integrates `VoiceSearchModal.jsx`.
  - Normalizes Devanagari Hindi input via `translateDevanagari` (e.g., `'दूध'` -> `'milk'`, `'मैगी'` -> `'maggi'`).
- **Mobile Back Button Navigation**:
  - Handles HTML5 `history.pushState` on mount.
  - Listens to `popstate` to cleanly close search and return to the parent view without leaving an orphaned forward history state.

---

## 4. Frontend Utilities & Algorithms

### 4.1. `unitPriceHelper.js`
*File location: `src/utils/unitPriceHelper.js`*

Provides mathematical normalization and quantity string parsing.
- **Quantity Parser (`parseQuantity`)**:
  - Recognizes standard patterns (`"125 g"`, `"1.5 kg"`, `"500 ml"`, `"1 L"`, `"6 pcs"`).
  - Handles embedded strings (`"Pack of 500 g"`, `"Special offer 2 kg"`).
  - Normalizes aliases: `gm`, `gms`, `gram` -> `g`; `kgs`, `kilo` -> `kg`; `mls`, `milliliter` -> `ml`; `ltr`, `liter` -> `L`.
- **Unit Price Calculation Formula (`calculateUnitPrice`)**:
  - Weight < 1000g: standardized to **100 g**  
    $$\text{UnitPrice} = \text{round}\left(\frac{\text{SellingPrice}}{\text{Value}} \times 100\right) \quad \longrightarrow \quad \text{₹UnitPrice/100 g}$$
  - Weight $\ge$ 1000g or in kg: standardized to **kg**  
    $$\text{UnitPrice} = \text{round}\left(\frac{\text{SellingPrice}}{\text{WeightInKg}}\right) \quad \longrightarrow \quad \text{₹UnitPrice/kg}$$
  - Volume < 1000ml: standardized to **100 ml**  
    $$\text{UnitPrice} = \text{round}\left(\frac{\text{SellingPrice}}{\text{Value}} \times 100\right) \quad \longrightarrow \quad \text{₹UnitPrice/100 ml}$$
  - Volume $\ge$ 1000ml or in L: standardized to **L**  
    $$\text{UnitPrice} = \text{round}\left(\frac{\text{SellingPrice}}{\text{VolumeInL}}\right) \quad \longrightarrow \quad \text{₹UnitPrice/L}$$
  - Multi-count items: standardized to **pc**  
    $$\text{UnitPrice} = \text{round}\left(\frac{\text{SellingPrice}}{\text{Count}}\right) \quad \longrightarrow \quad \text{₹UnitPrice/pc}$$

### 4.2. `dynamicFilterExtractor.js`
*File location: `src/utils/dynamicFilterExtractor.js`*

- **Dynamic Attribute Inference (`inferProductAttributes`)**:
  - **Gender**: Classifies into `Women`, `Men`, `Baby`, or `Unisex` based on contextual regex keywords and category classification.
  - **Grain Type**: Classifies into `Basmati`, `Daily Rice`, or `Brown Rice`.
  - **Dietary**: Detects vegetarian vs non-vegetarian ingredients.
  - **Brand**: Normalizes clean brand strings, discarding `'nan'` or `'undefined'`.
  - **Price Per Unit Tiers**: Categorizes into standard brackets (`under_50`, `50_100`, `100_150`, `150_plus`).
- **Facet Aggregation (`extractDynamicFilters`)**:
  - Dynamically detects query domain (powder/cosmetics vs rice/groceries) to activate the corresponding filter pills.
- **Filter and Sort Engine (`applyFiltersAndSort`)**:
  - Executes multi-attribute conjunction filtering (gender, grain type, brand array, min/max price, unit price tiers).
  - Performs multi-mode sorting (`relevance`, `price_asc`, `price_desc`, `discount_desc`, `rating_desc`).

### 4.3. `categoryThumbnailMap.js`
*File location: `src/utils/categoryThumbnailMap.js`*

- Maps categories and key terms to high-resolution Cloudinary CDN thumbnails.
- Implements `getVisualSuggestions(query, items, limit)` for zero-latency local autocomplete suggestions.

---

## 5. Backend Architecture & API Specifications

The backend service layer is implemented in Node.js / Express with Mongoose models (`packitout-api/`).

### 5.1. `GET /catalog/autocomplete`
*File: `packitout-api/index.js` & `packitout-api/services/catalogSearchService.js`*

- **Query Parameters**:
  - `q` (string, required): Search query prefix or keyword.
  - `shopId` (string, optional): Shop inventory scoping.
  - `limit` (integer, default: 8): Maximum suggestions to return.
- **Processing**:
  - Extracts matching broad categories, subcategories, brands, and compound phrases (e.g. *"Talcum powder"*, *"Face powder"*, *"Detergent powder"*, *"Himalaya baby powder"*).
  - Pairs each suggestion with representative Cloudinary category thumbnails.
  - Ranks suggestions by relevance and matching product counts.
- **Sample Response**:
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
        "thumbnail": "https://res.cloudinary.com/dj48tkcsw/image/upload/v1775368062/Products/Amul/kp5mli0uneidjzg4ytmm.webp",
        "itemCount": 253
      },
      {
        "id": "type_talcum_powder",
        "text": "Talcum Powder",
        "type": "subCategory",
        "category": "Beauty & Grooming",
        "subCategory": "Deodorants & Fragrances",
        "thumbnail": "https://res.cloudinary.com/dj48tkcsw/image/upload/v1775368062/Products/Amul/kp5mli0uneidjzg4ytmm.webp",
        "itemCount": 18
      }
    ]
  }
  ```

### 5.2. `GET /catalog/filters`
*File: `packitout-api/index.js` & `packitout-api/utils/attributeExtractor.js`*

- **Query Parameters**: `q`, `category`, `subCategory`, `shopId`.
- **Processing**:
  - Gathers matching products for the current query/category.
  - Runs dynamic attribute inference (`inferProductAttributes`) across all matches.
  - Derives dynamic filter pills (Gender for powder; Grain Type and Price per kg for rice; Brand for all).
  - Computes global price bounds (`min`, `max`) and exports standard sort options.
- **Sample Response (Powder context)**:
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
        "priority": 1,
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
        "priority": 2,
        "options": [
          { "value": "Pond's", "label": "Pond's", "count": 12 },
          { "value": "Enchanteur", "label": "Enchanteur", "count": 8 },
          { "value": "Himalaya", "label": "Himalaya", "count": 6 }
        ]
      }
    ]
  }
  ```

### 5.3. `GET /shops/:id/search`
*File: `packitout-api/index.js` & `packitout-api/services/catalogSearchService.js`*

- **Query Parameters**: `q`, `category`, `subCategory`, `brand`, `gender`, `grainType`, `minPrice`, `maxPrice`, `minUnitPrice`, `maxUnitPrice`, `sort`, `page`, `limit`.
- **Processing**:
  - Multi-token relevance search across `name`, `brand`, `category`, `subCategory`, `searchTags`, and `barcode`.
  - Dynamic facet filtering with exact token matching.
  - **Variant Consolidation**: Groups items by `itemGroupId`, selecting the primary variant for card display while consolidating size siblings into an interactive `variants` array.
  - Computes exact unit pricing and displays (`unitPrice`, `unitMeasure`, `unitPriceDisplay`).
  - Supports pagination (`page`, `limit`, `totalPages`, `hasMore`).

---

## 6. Dynamic Context Adaptation: Powder vs Rice Comparison

A core innovation of this system is **context-aware dynamic facet derivation**. The horizontal filter bar reconfigures its pills based on the active query:

| Dimension | Cosmetics / Powder Search (`q=powder`) | Grocery / Rice Search (`q=rice`) |
|-----------|----------------------------------------|----------------------------------|
| **Primary Dynamic Pill** | **`Gender`** (`Women`, `Men`, `Baby`, `Unisex`) | **`Grain Type`** (`Basmati`, `Daily Rice`, `Brown Rice`) |
| **Secondary Dynamic Pill** | **`Brand`** (Pond's, Enchanteur, Nivea, Himalaya) | **`Brand`** (India Gate, Daawat, Fortune, Kohinoor) |
| **Unit Price Pill** | **`Price per 100g`** (`Under ₹50/100g`, `Above ₹100/100g`) | **`Price per kg`** (`Under ₹50/kg`, `₹50 - ₹100/kg`, `Above ₹150/kg`) |
| **Standard Controls** | `Filters`, `Sort`, `Price` | `Filters`, `Sort`, `Price` |
| **Catalog Attribute Source** | Extracted from product name, subCategory, and demographic cues | Extracted from rice variety, grain description, and grain tags |

---

## 7. Automated Test Suite & Verification Matrix

The smart search subsystem is verified by **140 automated tests across 9 test suites** covering Tiers 1 through 4.

### 7.1. Test Execution Summary

```
========================================================================
FULL TEST SUITE EXECUTION SUMMARY
========================================================================
Frontend (Vitest 2.1.9 + RTL 16.3 + jsdom 24.1):
  ✓ src/__tests__/smoke.test.js (1 test)
  ✓ src/__tests__/unitPricing.test.js (23 tests)
  ✓ src/__tests__/DynamicFilterPills.test.jsx (19 tests)
  ✓ src/__tests__/SearchAutocomplete.test.jsx (18 tests)
  ✓ src/__tests__/EnhancedProductCard.test.jsx (20 tests)
  ✓ src/__tests__/SearchPage.test.jsx (16 tests)
  Total Frontend: 97 passed, 0 failed (27.13s)

Backend (Node.js Test Runner node:test):
  ✓ packitout-api/tests/catalogSearchService.test.js (10 tests)
  ✓ packitout-api/tests/attributeExtractor.test.js (10 tests)
  ✓ packitout-api/tests/unitPriceCalculator.test.js (23 tests)
  Total Backend: 43 passed, 0 failed

Grand Total: 140 passed, 0 failed, 0 skipped
Exit Code: 0
========================================================================
```

### 7.2. Four-Tier Verification Matrix

| Tier | Category | Coverage Focus | Total Tests | Status |
|------|----------|----------------|:-----------:|:------:|
| **Tier 1** | Feature Coverage (Happy Path) | Autocomplete rendering, thumbnail display, dynamic pills derivation, variant selection, unit pricing display. | 48 | **PASS** |
| **Tier 2** | Boundary & Corner Cases | Empty search queries, zero-result terms, null/undefined quantities, special characters, regex ReDoS safety, single vs multi-variant boundaries. | 44 | **PASS** |
| **Tier 3** | Cross-Feature Interactions | Filter pill selection combined with price range and sort order; variant switching synchronizing with unit pricing; cart stepper synchronization with card state. | 28 | **PASS** |
| **Tier 4** | Real-World Application Scenarios | Complete end-to-end user flows (search -> autocomplete click -> dynamic filter selection -> variant dropdown selection -> add to cart -> floating cart verification). | 20 | **PASS** |
| **TOTAL** | **All 4 Tiers** | **Comprehensive Full System Coverage** | **140** | **PASS** |

---

## 8. Parallel Verification Wave & Forensic Audit Results

Milestone 4 conducted an independent, parallel verification wave consisting of two Reviewers, two Challengers, and a Forensic Integrity Auditor:

### 8.1. Verifier Reports Summary

1. **Reviewer 1 (`teamwork_reviewer` - Primary Full-Suite)**: **APPROVE**
   - Verified clean production build (`npm run build` completed in 16.06s with 0 errors).
   - Executed full test suite (`npm run test:all`): 140/140 passed cleanly.
   - Confirmed full satisfaction of requirements R1, R2, R3, and R4.
2. **Reviewer 2 (`teamwork_reviewer` - Secondary Component)**: **APPROVE**
   - Verified UI fidelity against the reference image (`media_1794831507020_c20aae93.jpg`).
   - Confirmed styling details: 3-column layout, emerald green `ADD` button, inline variant dropdown, unit price positioning, struck MRP, and delivery ETA badge.
   - Executed target-scoped component tests: 96/96 passed.
3. **Challenger 1 (`teamwork_challenger` - Adversarial Unit Pricing)**: **APPROVE**
   - Tested canonical target values:
     - `125 g @ ₹148` $\rightarrow$ strictly `₹118/100 g`
     - `100 g @ ₹140` $\rightarrow$ strictly `₹140/100 g`
     - `1 kg @ ₹171` $\rightarrow$ strictly `₹171/kg`
   - Empirically probed edge cases: fractional quantities (`0.5 kg`, `250.5 g`), multipliers (`2 x 100 g`), parenthesized units (`"Pack of 2 (100 ml)"`), and negative/zero boundaries. All passed.
4. **Challenger 2 (`teamwork_challenger` - Adversarial Search & Filters)**: **APPROVE**
   - Tested facet aggregation speed over 1,500 catalog items: executed in < 15ms.
   - Evaluated regex security: query tokenization uses `String.prototype.includes` instead of dynamic RegExp compilation, eliminating ReDoS vulnerabilities.
   - Validated variant consolidation by `itemGroupId` with 0 card duplication.
5. **Auditor 1 (`teamwork_auditor` - Forensic Integrity)**: **CLEAN (VERIFIED GENUINE)**
   - Static analysis: 0 hardcoded test facades, 0 mock string bypasses.
   - Unit pricing algorithms perform genuine mathematical division.
   - React components utilize genuine state hooks (`useState`, `useMemo`, `useEffect`, `useRef`).
   - Independent verification: 140/140 tests executed and passed cleanly.

### 8.2. Gate Verdict

```markdown
## Gate Status: PASS
- Primary Reviewer: APPROVE
- Secondary Reviewer: APPROVE
- Unit Pricing Challenger: APPROVE
- Search & Filter Challenger: APPROVE
- Forensic Auditor: CLEAN (Zero integrity violations)
```

---

## 9. File & Code Layout Directory Map

```
c:\Users\888am\OneDrive\Desktop\shop\
├── PROJECT.md                               # Project scope, feature inventory & interface contracts
├── TEST_INFRA.md                            # Testing strategy & coverage methodology
├── TEST_READY.md                            # Test suite completion signal & verification log
├── TECHNICAL_OVERVIEW.md                    # Comprehensive architectural walkthrough (this document)
│
├── src/
│   ├── SearchPage.jsx                       # Main search orchestration page
│   ├── components/search/
│   │   ├── SearchAutocompleteOverlay.jsx    # Visual autocomplete overlay with thumbnails
│   │   ├── SearchFilterBar.jsx              # Context-aware horizontal filter & sort bar
│   │   └── EnhancedProductCard.jsx          # Quick-commerce product card with variant selector
│   ├── utils/
│   │   ├── unitPriceHelper.js               # Quantity parser & standardized unit pricing calculations
│   │   ├── dynamicFilterExtractor.js        # Attribute inference, dynamic facet extraction & filtering
│   │   └── categoryThumbnailMap.js          # Cloudinary thumbnails & bold differentiator formatting
│   └── __tests__/
│       ├── setup.js                         # Vitest DOM configuration & setup
│       ├── smoke.test.js                    # Test environment smoke check (1 test)
│       ├── unitPricing.test.js              # Unit pricing calculation & parsing suite (23 tests)
│       ├── SearchAutocomplete.test.jsx      # Autocomplete overlay component suite (18 tests)
│       ├── DynamicFilterPills.test.jsx      # Filter bar & dynamic pills suite (19 tests)
│       ├── EnhancedProductCard.test.jsx     # Enhanced product card & variant suite (20 tests)
│       └── SearchPage.test.jsx              # Search page integration suite (16 tests)
│
└── packitout-api/
    ├── index.js                             # Express API mounting autocomplete, filters & search routes
    ├── services/
    │   └── catalogSearchService.js          # Autocomplete, variant grouping & search service
    ├── utils/
    │   ├── unitPriceCalculator.js           # Server-side quantity parser & unit price math
    │   └── attributeExtractor.js            # Server-side attribute inference & facet aggregation
    └── tests/
        ├── unitPriceCalculator.test.js      # Backend unit price test suite (23 tests)
        ├── attributeExtractor.test.js       # Backend attribute extractor test suite (10 tests)
        └── catalogSearchService.test.js     # Backend catalog search service test suite (10 tests)
```

---

## 10. Verification Commands

Any engineer or auditor can independently reproduce the verification outcomes with the following canonical commands:

```bash
# 1. Run full automated test suite (140 tests)
npm run test:all

# 2. Run frontend Vitest suite (97 tests)
npm run test:frontend

# 3. Run backend Node test suite (43 tests)
npm run test:backend

# 4. Run production frontend build
npm run build
```

---
*End of Technical Overview Walkthrough.*

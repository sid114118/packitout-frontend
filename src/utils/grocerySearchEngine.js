// 🛒 GROCERY SEARCH ENGINE — Next-Gen Intelligence for Indian Quick-Commerce
// Handles Romanized Hinglish (haldi -> turmeric), Smart Stemming (biscuits -> biscuit),
// Stop-Word Removal (packet of milk -> milk), False-Positive Guards (haldi != haldiram),
// and Category-Weighted Intent Ranking (milk -> Dairy over Biscuits).

// 1. Comprehensive Hinglish & Grocery Synonym Dictionary
export const GROCERY_SYNONYMS = {
  // Spices & Masalas
  'haldi': ['turmeric', 'turmeric powder', 'haldi powder'],
  'turmeric': ['haldi', 'turmeric powder'],
  'mirch': ['chilli', 'chilly', 'red chilli', 'mirchi'],
  'mirchi': ['chilli', 'chilly', 'green chilli', 'mirch'],
  'chilli': ['mirch', 'mirchi', 'chilly'],
  'chilly': ['mirch', 'mirchi', 'chilli'],
  'dhaniya': ['coriander', 'coriander powder', 'dhania'],
  'dhania': ['coriander', 'dhaniya'],
  'coriander': ['dhaniya', 'dhania'],
  'jeera': ['cumin', 'cumin seeds', 'zeera'],
  'zeera': ['cumin', 'jeera'],
  'cumin': ['jeera', 'zeera'],
  'namak': ['salt', 'tata salt'],
  'salt': ['namak'],
  'kala namak': ['black salt'],
  'black salt': ['kala namak'],
  'sendha namak': ['rock salt'],
  'hing': ['asafoetida'],
  'asafoetida': ['hing'],
  'adrak': ['ginger'],
  'ginger': ['adrak'],
  'lahsun': ['garlic', 'lassan'],
  'lassan': ['garlic', 'lahsun'],
  'garlic': ['lahsun', 'lassan'],
  'elaichi': ['cardamom'],
  'cardamom': ['elaichi'],
  'laung': ['clove'],
  'clove': ['laung'],
  'dalchini': ['cinnamon'],
  'cinnamon': ['dalchini'],
  'methi': ['fenugreek'],
  'saunf': ['fennel'],
  'rai': ['mustard seeds'],
  'sarson': ['mustard', 'rai'],
  'mustard': ['sarson', 'rai'],
  'masala': ['spices', 'garam masala'],
  'garam masala': ['masala', 'sabzi masala'],

  // Staples (Atta, Rice, Dal, Sugar, Oil)
  'atta': ['flour', 'wheat', 'gehu', 'chakki atta', 'aata'],
  'aata': ['flour', 'wheat', 'gehu', 'chakki atta', 'atta'],
  'flour': ['atta', 'aata', 'maida'],
  'maida': ['refined flour'],
  'besan': ['gram flour', 'chana flour'],
  'suji': ['semolina', 'sooji', 'rava'],
  'sooji': ['semolina', 'suji', 'rava'],
  'rava': ['semolina', 'sooji', 'suji'],
  'chawal': ['rice', 'basmati', 'chaawal'],
  'chaawal': ['rice', 'basmati', 'chawal'],
  'rice': ['chawal', 'chaawal', 'basmati'],
  'basmati': ['rice', 'chawal'],
  'poha': ['flattened rice', 'chivda', 'pohe'],
  'dal': ['lentils', 'pulses', 'daal', 'toor', 'arhar', 'moong', 'urad', 'chana'],
  'daal': ['lentils', 'pulses', 'dal', 'toor', 'arhar', 'moong'],
  'toor': ['arhar', 'tuvar', 'dal', 'daal'],
  'arhar': ['toor', 'tuvar', 'dal', 'daal'],
  'moong': ['mung', 'dal', 'daal'],
  'urad': ['dal', 'daal'],
  'masoor': ['dal', 'daal', 'red lentils'],
  'chana': ['gram', 'chickpeas', 'chhole', 'chole'],
  'chhole': ['chana', 'chickpeas', 'chole'],
  'chole': ['chana', 'chickpeas'],
  'rajma': ['kidney beans'],
  'cheeni': ['sugar', 'shakar', 'chini'],
  'chini': ['sugar', 'shakar', 'cheeni'],
  'sugar': ['cheeni', 'chini', 'shakar'],
  'gud': ['jaggery', 'gur'],
  'gur': ['jaggery', 'gud'],
  'jaggery': ['gud', 'gur'],
  'tel': ['oil', 'cooking oil', 'refined oil', 'mustard oil'],
  'tail': ['oil', 'tel'],
  'oil': ['tel', 'cooking oil', 'refined oil', 'mustard oil'],
  'sarson tel': ['mustard oil', 'kachi ghani'],
  'mustard oil': ['sarson tel', 'kachi ghani'],
  'refined': ['oil', 'fortune', 'refined oil'],
  'ghee': ['clarified butter', 'desi ghee'],
  'desi ghee': ['ghee', 'amul ghee'],
  'butter': ['makhan', 'amul butter'],
  'makhan': ['butter'],

  // Dairy & Bakery
  'doodh': ['milk'],
  'dudh': ['milk'],
  'milk': ['doodh', 'dudh', 'dairy'],
  'dahi': ['curd', 'yogurt'],
  'curd': ['dahi', 'yogurt'],
  'yogurt': ['dahi', 'curd'],
  'paneer': ['cottage cheese'],
  'cottage cheese': ['paneer'],
  'cheese': ['paneer', 'amul cheese', 'cheese slice'],
  'chhaachh': ['buttermilk', 'mattha', 'chaas'],
  'chaas': ['buttermilk', 'chhaachh'],
  'buttermilk': ['chaas', 'chhaachh', 'lassi'],
  'lassi': ['buttermilk', 'chaas'],
  'bread': ['pav', 'bun', 'loaf', 'white bread', 'brown bread'],
  'pav': ['bread', 'bun'],
  'bun': ['bread', 'pav'],
  'anda': ['egg', 'eggs'],
  'ande': ['egg', 'eggs'],
  'egg': ['anda', 'ande', 'eggs'],
  'eggs': ['anda', 'ande', 'egg'],

  // Beverages & Breakfast
  'chai': ['tea', 'chai patti', 'tea leaves', 'tea powder'],
  'chay': ['tea', 'chai'],
  'tea': ['chai', 'chai patti', 'taj mahal', 'red label'],
  'coffee': ['nescafe', 'bru'],
  'paani': ['water', 'mineral water', 'bisleri'],
  'pani': ['water', 'bisleri'],
  'water': ['paani', 'pani', 'bisleri', 'kinley'],
  'cold drink': ['soda', 'coke', 'pepsi', 'sprite', 'soft drink', 'thums up', 'fanta'],
  'soft drink': ['cold drink', 'soda'],
  'soda': ['cold drink', 'soft drink'],
  'sharbat': ['syrup', 'roohafza', 'rooh afza'],
  'roohafza': ['sharbat', 'syrup'],
  'bournvita': ['health drink', 'horlicks', 'complan'],
  'horlicks': ['health drink', 'bournvita'],

  // Snacks & Confectionery
  'biskut': ['biscuit', 'biscuits', 'cookies'],
  'biskit': ['biscuit', 'biscuits'],
  'biscuit': ['biscuits', 'cookies', 'biskut'],
  'biscuits': ['biscuit', 'cookies', 'biskut'],
  'cookies': ['biscuit', 'biscuits'],
  'namkeen': ['bhujia', 'mixture', 'sev', 'chips', 'snacks'],
  'bhujia': ['namkeen', 'sev', 'bikanervala', 'aloo bhujia'],
  'chips': ['chip', 'wafers', 'crisps', 'lays', 'kurkure'],
  'chip': ['chips', 'wafers'],
  'wafers': ['chips', 'chip'],
  'kurkure': ['chips', 'namkeen', 'snack'],
  'choclat': ['chocolate', 'chocolates'],
  'choklet': ['chocolate', 'chocolates'],
  'chocolate': ['chocolates', 'cadbury', 'dairy milk'],
  'chocolates': ['chocolate', 'cadbury'],
  'mithai': ['sweets', 'soan papdi', 'gulab jamun', 'rasgulla'],
  'sweets': ['mithai', 'sweet'],
  'noodle': ['noodles', 'maggi'],
  'noodles': ['noodle', 'maggi', 'yippee'],
  'maggi': ['noodles', 'noodle', 'magi'],
  'magi': ['maggi', 'noodles'],
  'yippee': ['noodles', 'noodle'],
  'pasta': ['macaroni'],
  'macaroni': ['pasta'],
  'ketchup': ['sauce', 'tomato sauce'],
  'sauce': ['ketchup', 'tomato sauce'],

  // Fresh Produce
  'pyaz': ['onion', 'pyaaz', 'kanda'],
  'pyaaz': ['onion', 'kanda'],
  'kanda': ['onion', 'pyaz'],
  'onion': ['pyaz', 'pyaaz'],
  'aloo': ['potato', 'aalu', 'batata'],
  'aalu': ['potato', 'batata'],
  'batata': ['potato', 'aloo'],
  'potato': ['aloo', 'aalu'],
  'tamatar': ['tomato'],
  'tomato': ['tamatar'],
  'nimbu': ['lemon'],
  'lemon': ['nimbu'],
  'matar': ['peas', 'green peas'],
  'peas': ['matar'],
  'palak': ['spinach'],
  'gobi': ['cauliflower', 'cabbage'],
  'kheera': ['cucumber'],
  'seb': ['apple'],
  'kela': ['banana'],
  'aam': ['mango'],

  // Personal & Household Care
  'sabun': ['soap', 'bathing bar', 'body wash'],
  'soap': ['sabun', 'bathing bar', 'body wash', 'dettol', 'lux', 'dove'],
  'soaps': ['soap', 'sabun'],
  'shampoo': ['hair wash', 'clinic plus', 'head & shoulders', 'sunsilk'],
  'hair oil': ['oil', 'parachute', 'bajaj', 'almond drops'],
  'dawa': ['medicine', 'tablet', 'pharma'],
  'dawai': ['medicine', 'pharma'],
  'agarbatti': ['incense sticks', 'dhoop'],
  'dhoop': ['agarbatti'],
  'matchbox': ['machis', 'matches'],
  'machis': ['matchbox', 'matches'],
  'detergent': ['surf', 'washing powder', 'tide', 'ariel', 'surf excel', 'wheel', 'ghadi'],
  'surf': ['detergent', 'washing powder', 'surf excel'],
  'tide': ['detergent', 'washing powder'],
  'ariel': ['detergent', 'washing powder'],
  'bartan': ['dishwash', 'vim', 'bar', 'liquid'],
  'dishwash': ['vim', 'bartan', 'bar', 'liquid'],
  'vim': ['dishwash', 'bartan'],
  'colgate': ['toothpaste', 'toothbrush', 'paste'],
  'toothpaste': ['colgate', 'close up', 'pepsodent', 'dant kanti', 'sensodyne', 'paste'],
  'toothbrush': ['brush', 'colgate'],
  'brush': ['toothbrush'],
  'sanitary pad': ['whisper', 'stayfree', 'pads', 'napkin'],
  'pads': ['sanitary pad', 'whisper', 'stayfree'],
  'diaper': ['pampers', 'mamy poko', 'diapers', 'huggies'],
  'diapers': ['diaper', 'pampers', 'huggies'],
  'mosquito': ['all out', 'good knight', 'repellent', 'coil', 'liquid', 'refill'],
  'all out': ['mosquito', 'repellent', 'refill'],
  'harpic': ['toilet cleaner', 'cleaner'],
  'cleaner': ['harpic', 'lizol', 'colin'],
  'lizol': ['floor cleaner'],
  'pocha': ['floor cleaner', 'mop']
};

// 2. Stop words to remove so queries like "packet of milk" or "lays blue wala" work cleanly
export const STOP_WORDS = new Set([
  'of', 'and', 'the', 'in', 'for', 'with', 'to', 'at', 'by', 'from',
  'pack', 'packet', 'pkt', 'pcs', 'pc', 'piece', 'pieces', 'box', 'item', 'unit',
  'wala', 'wali', 'vale', 'wale', 'ka', 'ki', 'ke', 'ko', 'se', 'me', 'mein',
  'karo', 'chahiye', 'bhejo', 'de', 'do', 'lao', 'badi', 'choti', 'ek', 'do',
  'rs', 'rupees', 'price', 'gram', 'gm', 'gms', 'kg', 'kgs', 'ml', 'ltr', 'liter', 'litre'
]);

// 3. Smart Stemming (Plural -> Singular)
export const stemWord = (word) => {
  if (!word || typeof word !== 'string') return '';
  const w = word.toLowerCase().trim();
  if (w.length <= 3) return w;

  // Specific irregular & grocery plurals
  const DIRECT_STEMS = {
    'eggs': 'egg',
    'biscuits': 'biscuit',
    'cookies': 'cookie',
    'chips': 'chip',
    'wafers': 'wafer',
    'noodles': 'noodle',
    'chocolates': 'chocolate',
    'soaps': 'soap',
    'drinks': 'drink',
    'juices': 'juice',
    'spices': 'spice',
    'masalas': 'masala',
    'pulses': 'pulse',
    'dals': 'dal',
    'daals': 'daal',
    'leaves': 'leaf',
    'tomatoes': 'tomato',
    'potatoes': 'potato',
    'onions': 'onion',
    'chillies': 'chilli',
    'pastas': 'pasta',
    'diapers': 'diaper',
    'pads': 'pad',
    'matches': 'match',
    'bottles': 'bottle',
    'pouches': 'pouch',
    'packets': 'packet',
    'boxes': 'box',
  };
  if (DIRECT_STEMS[w]) return DIRECT_STEMS[w];

  // Exclude proper names/brands that end in 's'
  const EXCLUSIONS = new Set(['lays', 'pepsi', 'amul', 'tous', 'status', 'glass', 'grass', 'lotus', 'kiss']);
  if (EXCLUSIONS.has(w)) return w;

  if (w.endsWith('ies') && w.length > 4) return w.slice(0, -3) + 'y';
  if (w.endsWith('es') && w.length > 4 && (w.endsWith('shes') || w.endsWith('ches') || w.endsWith('sses') || w.endsWith('xes'))) return w.slice(0, -2);
  if (w.endsWith('s') && !w.endsWith('ss') && w.length > 3) return w.slice(0, -1);

  return w;
};

// 4. Token Cleaner: Strips punctuation, stop-words, and stems words
export const cleanAndStemQuery = (rawQuery = '') => {
  if (!rawQuery) return { cleanString: '', tokens: [], rawTokens: [] };
  const rawTokens = rawQuery
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const meaningful = rawTokens.filter(t => !STOP_WORDS.has(t));
  const finalTokens = (meaningful.length > 0 ? meaningful : rawTokens).map(stemWord);

  return {
    cleanString: finalTokens.join(' '),
    tokens: finalTokens,
    rawTokens
  };
};

// 5. Expand Tokens with Hinglish Synonyms (with false-positive guard)
export const expandQueryTokens = (tokens = []) => {
  const expanded = new Set(tokens);
  const fullPhrase = tokens.join(' ');

  // Multi-word synonyms first (e.g. "cold drink", "sarson tel")
  if (GROCERY_SYNONYMS[fullPhrase]) {
    GROCERY_SYNONYMS[fullPhrase].forEach(s => {
      s.split(/\s+/).forEach(part => expanded.add(stemWord(part)));
    });
  }

  // Single-word synonyms
  for (const t of tokens) {
    const syns = GROCERY_SYNONYMS[t];
    if (syns && Array.isArray(syns)) {
      syns.forEach(s => {
        s.split(/\s+/).forEach(part => expanded.add(stemWord(part)));
      });
    }
  }

  return Array.from(expanded);
};

// 6. Category Intent Detector: Identifies if query points to a primary department
export const detectCategoryIntent = (tokens = []) => {
  const tokenSet = new Set(tokens);

  if (tokens.some(t => ['milk', 'doodh', 'curd', 'dahi', 'paneer', 'butter', 'cheese', 'egg', 'anda', 'bread', 'bun', 'pav', 'chaas', 'lassi'].includes(t))) {
    return { category: 'Dairy, Bread & Eggs', boost: 140, keywords: ['milk', 'egg', 'bread', 'butter', 'paneer', 'curd', 'dahi'] };
  }
  if (tokens.some(t => ['atta', 'flour', 'rice', 'chawal', 'dal', 'daal', 'toor', 'arhar', 'moong', 'besan', 'sooji', 'maida', 'sugar', 'cheeni', 'salt', 'namak', 'oil', 'tel', 'haldi', 'turmeric', 'chilli', 'mirch', 'dhaniya', 'jeera', 'masala', 'spices'].includes(t))) {
    return { category: 'Atta, Rice & Dal', boost: 140, keywords: ['turmeric', 'haldi', 'chilli', 'atta', 'rice', 'dal', 'oil', 'salt', 'sugar'] };
  }
  if (tokens.some(t => ['chips', 'namkeen', 'bhujia', 'kurkure', 'lays', 'biscuit', 'cookie', 'wafer', 'rusk', 'snack'].includes(t))) {
    return { category: 'Chips & Namkeen', boost: 120, keywords: ['chips', 'biscuit', 'namkeen', 'kurkure'] };
  }
  if (tokens.some(t => ['coke', 'pepsi', 'sprite', 'cold drink', 'drink', 'juice', 'soda', 'water', 'paani', 'frooti', 'maaza', 'beverage'].includes(t))) {
    return { category: 'Drinks & Juices', boost: 120, keywords: ['drink', 'juice', 'soda', 'water'] };
  }
  if (tokens.some(t => ['chocolate', 'candy', 'toffee', 'sweet', 'mithai', 'barone', 'kitkat', 'cadbury', 'dairy milk'].includes(t))) {
    return { category: 'Sweets & Chocolates', boost: 120, keywords: ['chocolate', 'sweet'] };
  }
  if (tokens.some(t => ['maggi', 'noodle', 'pasta', 'macaroni', 'yippee', 'instant', 'soup', 'ketchup', 'sauce'].includes(t))) {
    return { category: 'Instant Food', boost: 120, keywords: ['noodles', 'maggi', 'pasta'] };
  }
  if (tokens.some(t => ['soap', 'sabun', 'shampoo', 'toothpaste', 'brush', 'colgate', 'dettol', 'body wash', 'facewash', 'lotion', 'hair oil'].includes(t))) {
    return { category: 'Bath & Body', boost: 120, keywords: ['soap', 'shampoo', 'toothpaste'] };
  }
  if (tokens.some(t => ['detergent', 'surf', 'tide', 'ariel', 'vim', 'dishwash', 'harpic', 'cleaner', 'all out', 'mosquito'].includes(t))) {
    return { category: 'Cleaning & Household', boost: 120, keywords: ['detergent', 'dishwash', 'cleaner'] };
  }
  if (tokens.some(t => ['apple', 'banana', 'tomato', 'tamatar', 'potato', 'aloo', 'onion', 'pyaz', 'lemon', 'nimbu', 'fruit', 'vegetable'].includes(t))) {
    return { category: 'Fruits & Veg', boost: 120, keywords: ['vegetables', 'fruits'] };
  }
  return null;
};

// 7. False-Positive Boundary Guard
// Ensures words match as distinct words (e.g. 'haldi' matches 'Everest Haldi Powder' or 'Turmeric',
// but NEVER matches 'Haldiram'!).
export const matchesWordBoundary = (haystack = '', word = '') => {
  if (!haystack || !word) return false;
  // Escape regex specials
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(^|[^a-zA-Z0-9])${escaped}([^a-zA-Z0-9]|$)`, 'i');
  return regex.test(haystack);
};

// 8. Comprehensive Product Relevance Scorer
export const scoreProduct = (item, rawQuery, cleanTokens, expandedTokens, categoryIntent) => {
  if (!item) return -1;
  const qLower = rawQuery.toLowerCase().trim();
  const name = String(item.name || '').toLowerCase();
  const brand = String(item.brand || '').toLowerCase();
  const category = String(item.category || '').toLowerCase();
  const subCategory = String(item.subCategory || '').toLowerCase();
  const barcode = String(item.barcode || '').toLowerCase();
  const tagsStr = Array.isArray(item.searchTags) ? item.searchTags.join(' ').toLowerCase() : String(item.searchTags || '').toLowerCase();

  const fullHaystack = `${name} ${brand} ${category} ${subCategory} ${barcode} ${tagsStr}`;

  // 1. Exact Barcode Match = Highest Priority (Immediate direct hit)
  if (barcode && (barcode === qLower || barcode.includes(qLower))) {
    return 1000;
  }

  // 2. False-Positive Guard for specific words:
  // If user searched for 'haldi', do NOT allow match just because brand is 'haldiram'
  if (cleanTokens.includes('haldi') && !fullHaystack.includes('turmeric') && !matchesWordBoundary(name, 'haldi') && !matchesWordBoundary(tagsStr, 'haldi')) {
    if (brand.includes('haldiram') || name.includes('haldiram')) {
      return -1; // Block false match
    }
  }

  // 3. Token Verification:
  // Either all clean tokens must be found, OR their expanded synonyms must be found
  const hasAllDirectTokens = cleanTokens.length > 0 && cleanTokens.every(tok => {
    return matchesWordBoundary(fullHaystack, tok) || fullHaystack.includes(tok);
  });

  const hasAllExpandedTokens = !hasAllDirectTokens && expandedTokens.length > 0 && cleanTokens.some(tok => {
    // Check if at least the core concept is present via synonym
    const syns = GROCERY_SYNONYMS[tok] || [];
    return syns.some(s => matchesWordBoundary(fullHaystack, s) || fullHaystack.includes(s));
  });

  if (!hasAllDirectTokens && !hasAllExpandedTokens) {
    return -1; // Does not match
  }

  let score = 50;

  // Exact full title match
  if (name === qLower) score += 300;
  else if (name.startsWith(qLower)) score += 180;
  else if (matchesWordBoundary(name, qLower)) score += 120;

  // Direct token in title boost
  for (const tok of cleanTokens) {
    if (matchesWordBoundary(name, tok)) score += 60;
    else if (name.includes(tok)) score += 30;
    if (matchesWordBoundary(brand, tok)) score += 40;
    if (matchesWordBoundary(tagsStr, tok)) score += 30;
  }

  // Synonym in title boost
  for (const exp of expandedTokens) {
    if (!cleanTokens.includes(exp)) {
      if (matchesWordBoundary(name, exp)) score += 80;
      if (matchesWordBoundary(tagsStr, exp)) score += 40;
    }
  }

  // 4. Category-Weighted Intent Boost
  if (categoryIntent) {
    const catMatches = category.includes(categoryIntent.category.toLowerCase()) || subCategory.includes(categoryIntent.category.toLowerCase());
    if (catMatches) {
      score += categoryIntent.boost; // Give massive priority to the right aisle!

      // Extra bonus if the core keyword is in the item name within this category
      if (categoryIntent.keywords.some(k => matchesWordBoundary(name, k))) {
        score += 50;
      }
    } else {
      // If category intent was strong (e.g. milk -> Dairy), but this product is in Bakery (Milk Bikis), penalize slightly
      if (name.includes('biscuit') || name.includes('cookie') || name.includes('cake') || name.includes('candy')) {
        score -= 40;
      }
    }
  }

  // 5. In-Stock Priority
  if (item.inStock !== false) {
    score += 40;
  } else {
    score -= 100; // Demote out-of-stock items
  }

  // 6. Featured item priority
  if (item.isFeatured) {
    score += 15;
  }

  return score;
};

// 9. Smart Live Suggestions Generator (for the pills below the searchbar)
const HINGLISH_SUGGESTION_MAP = {
  'haldi': { primary: 'Turmeric (Haldi)', extra: 'Turmeric Powder' },
  'turmeric': { primary: 'Turmeric Powder', extra: 'Haldi' },
  'doodh': { primary: 'Milk (Doodh)', extra: 'Fresh Milk' },
  'milk': { primary: 'Fresh Milk', extra: 'Amul Milk' },
  'dahi': { primary: 'Curd (Dahi)', extra: 'Fresh Curd' },
  'paneer': { primary: 'Fresh Paneer', extra: 'Amul Paneer' },
  'chawal': { primary: 'Rice (Chawal)', extra: 'Basmati Rice' },
  'rice': { primary: 'Basmati Rice', extra: 'Kolam Rice' },
  'atta': { primary: 'Chakki Atta', extra: 'Aashirvaad Atta' },
  'tel': { primary: 'Cooking Oil (Tel)', extra: 'Mustard Oil' },
  'sarson': { primary: 'Mustard Oil', extra: 'Sarson Ka Tel' },
  'cheeni': { primary: 'Sugar (Cheeni)', extra: 'White Sugar' },
  'chini': { primary: 'Sugar (Chini)', extra: 'White Sugar' },
  'sugar': { primary: 'Sugar (Cheeni)', extra: 'Madhur Sugar' },
  'namak': { primary: 'Tata Salt (Namak)', extra: 'Sendha Namak' },
  'salt': { primary: 'Tata Salt', extra: 'Rock Salt' },
  'mirch': { primary: 'Red Chilli Powder (Lal Mirch)', extra: 'Hari Mirch' },
  'dhaniya': { primary: 'Coriander Powder (Dhaniya)', extra: 'Green Coriander' },
  'jeera': { primary: 'Cumin Seeds (Jeera)', extra: 'Jeera Powder' },
  'anda': { primary: 'Eggs (Anda)', extra: 'Farm Fresh Eggs' },
  'ande': { primary: 'Eggs (Ande)', extra: 'Farm Fresh Eggs' },
  'eggs': { primary: 'Farm Fresh Eggs', extra: 'White Eggs' },
  'egg': { primary: 'Farm Fresh Eggs', extra: 'White Eggs' },
  'biscuit': { primary: 'Parle-G Biscuit', extra: 'Britannia Biscuits' },
  'biscuits': { primary: 'Parle-G Biscuit', extra: 'Britannia Biscuits' },
  'biskut': { primary: 'Parle-G Biscuit', extra: 'Britannia Biscuits' },
  'chai': { primary: 'Tea / Chai Patti', extra: 'Tata Tea Gold' },
  'tea': { primary: 'Tea / Chai Patti', extra: 'Tata Tea Gold' },
  'maggi': { primary: 'Maggi 2-Minute Noodles', extra: 'Yippee Noodles' },
  'noodle': { primary: 'Maggi Noodles', extra: 'Instant Noodles' },
  'noodles': { primary: 'Maggi Noodles', extra: 'Instant Noodles' },
  'sabun': { primary: 'Bath Soap (Sabun)', extra: 'Dettol Soap' },
  'soap': { primary: 'Bath Soap', extra: 'Dettol Soap' },
  'detergent': { primary: 'Washing Powder', extra: 'Surf Excel' },
  'surf': { primary: 'Surf Excel', extra: 'Washing Powder' },
  'toothpaste': { primary: 'Colgate Toothpaste', extra: 'Dant Kanti' },
  'colgate': { primary: 'Colgate Strong Teeth', extra: 'Colgate MaxFresh' },
  'lays': { primary: "Lay's India's Magic Masala", extra: "Lay's Classic Salted" },
  'kurkure': { primary: 'Kurkure Masala Munch', extra: 'Kurkure Solid Masti' },
  'amul': { primary: 'Amul Butter', extra: 'Amul Milk' },
  'machis': { primary: 'Matchbox (Machis)', extra: 'Homelite Matches' },
  'bartan': { primary: 'Vim Dishwash Bar', extra: 'Vim Liquid' },
  'pocha': { primary: 'Floor Cleaner / Lizol', extra: 'Floor Mop' },
  'kaju': { primary: 'Cashews (Kaju)', extra: 'W320 Kaju' },
  'badam': { primary: 'Almonds (Badam)', extra: 'California Almonds' },
  'kishmish': { primary: 'Raisins (Kishmish)', extra: 'Green Raisins' }
};

export const getSmartLiveSuggestions = (rawInput, flatItems = [], maxCount = 6) => {
  if (!rawInput || typeof rawInput !== 'string') return [];
  const q = rawInput.trim().toLowerCase();
  if (q.length < 1) return [];

  const { tokens, cleanString } = cleanAndStemQuery(q);
  const expanded = expandQueryTokens(tokens);
  const categoryIntent = detectCategoryIntent(tokens);

  const suggestions = [];
  const seen = new Set();

  const addSuggestion = (label) => {
    if (!label) return;
    const cleanLabel = String(label).trim();
    const lc = cleanLabel.toLowerCase();
    if (seen.has(lc) || lc === q) return;
    if (cleanLabel.length < 2 || cleanLabel.length > 40) return;
    seen.add(lc);
    suggestions.push(cleanLabel);
  };

  // 1. Direct Hinglish / Grocery Concept Suggestions
  const fullQ = tokens.join(' ');
  if (HINGLISH_SUGGESTION_MAP[fullQ]) {
    addSuggestion(HINGLISH_SUGGESTION_MAP[fullQ].primary);
    addSuggestion(HINGLISH_SUGGESTION_MAP[fullQ].extra);
  } else {
    for (const t of tokens) {
      if (HINGLISH_SUGGESTION_MAP[t]) {
        addSuggestion(HINGLISH_SUGGESTION_MAP[t].primary);
        addSuggestion(HINGLISH_SUGGESTION_MAP[t].extra);
        break;
      }
    }
  }

  // Helper to clean packaging noise from product title
  const cleanTitleForPill = (rawName) => {
    return rawName
      .replace(/\b\d+(\.\d+)?\s*(ml|l|ltr|liter|litre|g|gm|gms|gram|kg|kgs|pcs?|pieces?|pack|pkt)\b/gi, '')
      .replace(/[([{\-].*?[)\]}]/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  };

  // 2. Scan items for clean brand or product family names matching the query or its synonyms
  for (const item of flatItems) {
    if (!item) continue;
    const name = String(item.name || '').trim();
    const brand = String(item.brand || '').trim();
    const nameLower = name.toLowerCase();
    const brandLower = brand.toLowerCase();

    // Boundary & False-Positive Guard:
    // If user searched for 'haldi', do NOT allow 'Haldiram' to show up as suggestion!
    if ((tokens.includes('haldi') || q === 'haldi') && !q.startsWith('haldiram')) {
      if (brandLower.startsWith('haldiram') || nameLower.startsWith('haldiram')) {
        continue;
      }
    }

    // Category Intent check: If searching dairy (e.g. 'doodh', 'milk'), demote confectionery biscuits (e.g. Milk Bikis)
    if (categoryIntent && categoryIntent.category === 'Dairy, Bread & Eggs') {
      if (nameLower.includes('biscuit') || nameLower.includes('cookie') || nameLower.includes('cake')) {
        continue;
      }
    }

    // Check startsWith brand (e.g. typing "am" -> "Amul", "bri" -> "Britannia")
    if (brand && (brandLower.startsWith(q) || (cleanString && brandLower.startsWith(cleanString)))) {
      addSuggestion(brand);
    }

    // Check startsWith clean title
    if (name && (nameLower.startsWith(q) || (cleanString && nameLower.startsWith(cleanString)))) {
      const compactName = cleanTitleForPill(name);
      addSuggestion(compactName);
    }

    // Check query tokens in title or brand
    if (tokens.length > 0 && tokens.every(tok => matchesWordBoundary(nameLower, tok) || nameLower.includes(tok))) {
      const compactName = cleanTitleForPill(name);
      addSuggestion(compactName);
    }

    // Check expanded synonyms in title (e.g. user typed 'haldi', suggest 'Everest Turmeric')
    for (const exp of expanded) {
      if (!tokens.includes(exp)) {
        if (matchesWordBoundary(nameLower, exp) || nameLower.startsWith(exp)) {
          const compactName = cleanTitleForPill(name);
          addSuggestion(compactName);
          break;
        }
      }
    }

    if (suggestions.length >= maxCount) break;
  }

  // 3. Fallback to subcategory or category names
  if (suggestions.length < maxCount) {
    for (const item of flatItems) {
      const sub = String(item.subCategory || item.category || '').trim();
      const subLower = sub.toLowerCase();
      if (sub && (subLower.includes(q) || (cleanString && subLower.includes(cleanString)))) {
        addSuggestion(sub);
      }
      if (suggestions.length >= maxCount) break;
    }
  }

  return suggestions.slice(0, maxCount);
};

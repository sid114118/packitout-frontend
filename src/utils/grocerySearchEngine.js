/**
 * PackItOut - Indian Grocery Search, Ranking & Catalog Classification Engine (Frontend ES Module)
 * Powers bilingual Hinglish/English synonym expansion, stemming, typo tolerance,
 * category intent detection, pure/core product prioritization, and derivative demotion.
 */

// 1. Comprehensive Bilingual (Hinglish/English) Synonym Groups
const RAW_SYNONYM_GROUPS = [
  // Cashew / Kaju
  ['kaju', 'cashew', 'cashews', 'kajoo', 'kajju'],
  // Almond / Badam
  ['badam', 'badaam', 'almond', 'almonds'],
  // Raisin / Kishmish
  ['kishmish', 'kismis', 'raisin', 'raisins', 'darkh', 'draksh', 'munakka'],
  // Pistachio / Pista
  ['pista', 'pistachio', 'pistachios'],
  // Walnut / Akhrot
  ['akhrot', 'akrot', 'walnut', 'walnuts'],
  // Fox nuts / Makhana
  ['makhana', 'foxnut', 'foxnuts', 'fox nut', 'fox nuts', 'lotus seeds', 'phool makhana'],
  // Figs / Anjeer
  ['anjeer', 'anjir', 'fig', 'figs'],
  // Dates / Khajur
  ['khajur', 'khajoor', 'dates', 'date'],

  // Rice / Chawal
  ['rice', 'chawal', 'basmati', 'kolam', 'sonamasoori', 'sona masoori'],
  // Wheat Flour / Atta
  ['atta', 'flour', 'wheat flour', 'gehu ka atta', 'chakki atta', 'gehun', 'gehu'],
  // Refined Flour / Maida
  ['maida', 'refined flour', 'all purpose flour'],
  // Gram Flour / Besan
  ['besan', 'gram flour', 'chickpea flour'],
  // Semolina / Suji
  ['suji', 'sooji', 'rava', 'semolina'],
  // Poha / Flattened Rice
  ['poha', 'flattened rice', 'beaten rice', 'chiwda', 'chivda'],
  // Sabudana / Tapioca
  ['sabudana', 'sago', 'tapioca'],
  // Dalia / Broken Wheat
  ['dalia', 'broken wheat'],

  // Pulses / Dal
  ['dal', 'daal', 'pulses', 'lentils', 'pulse', 'lentil'],
  // Toor Dal / Arhar
  ['toor', 'tuvar', 'arhar', 'toor dal', 'arhar dal', 'pigeon pea'],
  // Moong / Green Gram
  ['moong', 'mung', 'green gram', 'mung bean', 'moong dal'],
  // Urad / Black Gram
  ['urad', 'black gram', 'urad dal'],
  // Chana / Chickpea
  ['chana', 'chane', 'gram', 'chickpea', 'chickpeas', 'chana dal', 'kala chana'],
  // Chole / Kabuli Chana
  ['chole', 'kabuli chana', 'safed chana'],
  // Rajma / Kidney Beans
  ['rajma', 'kidney beans', 'kidney bean'],
  // Masoor / Red Lentil
  ['masoor', 'red lentil', 'red lentils', 'masoor dal'],
  // Peas / Matar
  ['matar', 'muttar', 'peas', 'green peas', 'pea'],

  // Sweeteners & Salt
  ['sugar', 'chini', 'cheeni', 'shakkar', 'shakar'],
  ['gud', 'gur', 'jaggery'],
  ['salt', 'namak', 'sendha namak', 'rock salt', 'black salt', 'kala namak'],

  // Cooking Oils & Ghee
  ['oil', 'tel', 'cooking oil', 'refined oil'],
  ['mustard oil', 'sarson tel', 'sarson ka tel', 'sarson'],
  ['ghee', 'desi ghee', 'clarified butter'],
  ['til', 'sesame', 'sesame seeds'],

  // Spices & Condiments
  ['haldi', 'turmeric', 'turmeric powder', 'haldi powder'],
  ['jeera', 'jira', 'cumin', 'cumin seeds'],
  ['mirch', 'mirchi', 'chilli', 'chili', 'red chilli', 'lal mirch', 'pepper'],
  ['dhaniya', 'dhania', 'coriander', 'coriander powder'],
  ['elaichi', 'ilaychi', 'cardamom', 'green cardamom'],
  ['laung', 'lavang', 'clove', 'cloves'],
  ['saunf', 'fennel', 'fennel seeds'],
  ['methi', 'fenugreek', 'fenugreek seeds', 'kasuri methi'],
  ['ajwain', 'carom', 'carom seeds'],
  ['hing', 'asafoetida'],
  ['dalchini', 'cinnamon'],
  ['adrak', 'ginger'],
  ['lehsun', 'lahsun', 'garlic'],

  // Dairy, Eggs & Fresh
  ['milk', 'doodh', 'toned milk', 'cow milk'],
  ['dahi', 'curd', 'yogurt'],
  ['butter', 'makhan'],
  ['paneer', 'cottage cheese'],
  ['egg', 'eggs', 'anda', 'ande'],

  // Beverages & Breakfast
  ['tea', 'chai', 'chay', 'tea leaves', 'tea bags'],
  ['coffee', 'kafi', 'nescafe', 'bru'],

  // Snacks & Biscuits
  ['biscuit', 'biscuits', 'biscut', 'biscute', 'biscutes', 'cookie', 'cookies'],
  ['rusk', 'khari', 'toast'],
  ['namkeen', 'farsan', 'mixture', 'bhujia', 'sev'],
  ['chips', 'wafers', 'crisps', 'kurkure', 'lays', 'bingo'],

  // Personal Care, Soaps & Cleaning
  ['soap', 'soaps', 'sabun', 'shabun', 'bathing soap', 'body wash', 'bathing bar'],
  ['detergent', 'washing powder', 'surf', 'surf excel', 'ariel', 'tide', 'rin'],
  ['shampoo', 'hair wash', 'hair cleanser'],
  ['toothpaste', 'tooth paste', 'dant kanti', 'colgate', 'pepsodent', 'close up', 'manjan'],

  // Pooja Needs
  ['agarbatti', 'incense', 'incense sticks', 'dhoop', 'dhoopbatti'],
  ['kapoor', 'camphor', 'karpoor']
];

// Automatically build bidirectional symmetrical synonym map and phrase index
const SYNONYM_MAP = {};
const PHRASE_SYNONYMS = [];

for (const group of RAW_SYNONYM_GROUPS) {
  for (const item of group) {
    const key = item.toLowerCase().trim();
    if (!SYNONYM_MAP[key]) SYNONYM_MAP[key] = [];
    for (const syn of group) {
      if (!SYNONYM_MAP[key].includes(syn)) {
        SYNONYM_MAP[key].push(syn);
      }
    }
    if (key.includes(' ')) {
      PHRASE_SYNONYMS.push({ phrase: key, synonyms: group });
    }
  }
}

// 2. Core Intent Definitions: Intent Categories, Core Terms, and Derivative Words
const CORE_INTENTS = {
  kaju: {
    coreTerms: ['kaju', 'cashew', 'cashews', 'w210', 'w240', 'w320', 'tukda', 'whole nuts', 'giri'],
    intentCategories: ['Dry Fruits & Cereals', 'Dry Fruits, Nuts & Seeds', 'Almonds & Cashews', 'Dry Fruits & Seeds'],
    derivativeWords: [
      'biscuit', 'biscuits', 'cookie', 'cookies', 'mixture', 'namkeen', 'ice cream', 'ice-cream', 'kulfi',
      'katli', 'katri', 'shake', 'chikki', 'bar', 'chocolate', 'chocolates', 'sweet', 'mithai',
      'syrup', 'essence', 'perfumed', 'cake', 'curry', 'masala', 'gravy', 'paste', 'sharbat', 'drink',
      'spread', 'cereal', 'cornflakes', 'muesli'
    ]
  },
  badam: {
    coreTerms: ['badam', 'badaam', 'almond', 'almonds', 'giri'],
    intentCategories: ['Dry Fruits & Cereals', 'Dry Fruits, Nuts & Seeds', 'Almonds & Cashews'],
    derivativeWords: [
      'hair oil', 'oil', 'serum', 'biscuit', 'biscuits', 'cookie', 'cookies', 'ice cream', 'ice-cream', 'kulfi',
      'shake', 'milk drink', 'drink', 'beverage', 'shrikhand', 'katli', 'bar', 'chocolate', 'chocolates',
      'soap', 'lotion', 'cream', 'face wash', 'scrub', 'shampoo', 'sharbat', 'syrup', 'thandai',
      'complan', 'horlicks', 'health drink', 'spread', 'cereal', 'cornflakes', 'muesli', 'cake', 'halwa', 'curry', 'masala'
    ]
  },
  pista: {
    coreTerms: ['pista', 'pistachio', 'pistachios'],
    intentCategories: ['Dry Fruits & Cereals', 'Pistachios Walnuts', 'Dry Fruits, Nuts & Seeds'],
    derivativeWords: [
      'ice cream', 'ice-cream', 'kulfi', 'shake', 'biscuit', 'biscuits', 'cookie', 'cookies', 'shrikhand',
      'drink', 'sharbat', 'syrup', 'thandai', 'complan', 'chocolate', 'chocolates', 'cake', 'sweet', 'mithai'
    ]
  },
  kishmish: {
    coreTerms: ['kishmish', 'kismis', 'raisin', 'raisins', 'darkh', 'draksh', 'munakka'],
    intentCategories: ['Dry Fruits & Cereals', 'Raisins & Figs', 'Dry Fruits, Nuts & Seeds'],
    derivativeWords: ['ice cream', 'ice-cream', 'biscuit', 'biscuits', 'cookie', 'cookies', 'mixture', 'namkeen', 'chocolate', 'chocolates', 'bournville', 'cake', 'sweet', 'mithai', 'bar']
  },
  akhrot: {
    coreTerms: ['akhrot', 'akrot', 'walnut', 'walnuts'],
    intentCategories: ['Dry Fruits & Cereals', 'Pistachios Walnuts', 'Dry Fruits, Nuts & Seeds'],
    derivativeWords: ['hair serum', 'shampoo', 'hair oil', 'oil', 'scrub', 'face scrub', 'face wash', 'lotion', 'cream', 'soap', 'cake', 'cookie', 'cookies', 'biscuit', 'biscuits', 'chocolate', 'brownie']
  },
  rice: {
    coreTerms: ['rice', 'chawal', 'basmati', 'kolam', 'sona masoori', 'sonamasuri'],
    intentCategories: ['Atta & Rice', 'Basmati Rice', 'Daily Rice', 'Rice & Grains'],
    derivativeWords: ['bran oil', 'oil', 'papad', 'chips', 'flakes', 'poha', 'noodle', 'noodles', 'beer']
  },
  atta: {
    coreTerms: ['atta', 'wheat flour', 'flour', 'chakki', 'gehun'],
    intentCategories: ['Atta & Rice', 'Atta'],
    derivativeWords: ['chalani', 'strainer', 'channi', 'biscuit', 'biscuits', 'cookie', 'cookies', 'noodle', 'noodles', 'maggi', 'pasta', 'bread', 'rusk', 'cake']
  },
  haldi: {
    coreTerms: ['haldi', 'turmeric', 'haldi powder', 'turmeric powder'],
    intentCategories: ['Spices & Condiments', 'Masalas & Spices', 'Powdered Spices'],
    derivativeWords: ['soap', 'cream', 'face wash', 'gel', 'chandan', 'aloevera', 'biscuit', 'cookie', 'namkeen']
  },
  egg: {
    coreTerms: ['egg', 'eggs', 'anda', 'ande'],
    intentCategories: ['Dairy, Bread & Eggs'],
    derivativeWords: ['shampoo', 'hair', 'curry masala', 'eggless', 'mayo', 'mayonnaise', 'paneer', 'milk', 'cheese', 'butter', 'ghee', 'cream']
  },
  doodh: {
    coreTerms: ['doodh', 'milk', 'toned milk', 'cow milk'],
    intentCategories: ['Dairy, Bread & Eggs', 'Milk & Cream', 'Milk'],
    derivativeWords: ['biscuit', 'biscuits', 'cookie', 'cookies', 'chocolate', 'dairy milk', 'ice cream', 'ice-cream', 'cake', 'shake', 'rusk', 'candy']
  },
  chai: {
    coreTerms: ['chai', 'chay', 'tea', 'tea leaves'],
    intentCategories: ['Tea & Coffee', 'Tea', 'Tea Leaves & Dust'],
    derivativeWords: ['tree oil', 'iced tea', 'cup', 'strainer']
  },
  coffee: {
    coreTerms: ['coffee', 'instant coffee', 'ground coffee', 'nescafe', 'bru'],
    intentCategories: ['Tea & Coffee', 'Coffee'],
    derivativeWords: ['ice cream', 'ice-cream', 'biscuit', 'chocolate', 'cone', 'cake', 'candy']
  },
  dal: {
    coreTerms: ['dal', 'daal', 'toor', 'arhar', 'moong', 'urad', 'chana dal', 'masoor', 'rajma', 'chole'],
    intentCategories: ['Dals & Pulses'],
    derivativeWords: ['dalmoth', 'namkeen', 'papad']
  },
  besan: {
    coreTerms: ['besan', 'gram flour'],
    intentCategories: ['Atta & Rice', 'Besan, Maida & Suji'],
    derivativeWords: ['laddu', 'ladoo', 'bhujia', 'sev', 'namkeen', 'sweet', 'mithai']
  },
  sugar: {
    coreTerms: ['sugar', 'chini', 'cheeni', 'shakkar'],
    intentCategories: ['Oil, Ghee & Salt', 'Salt & Sugar', 'Salt, Sugar & Jaggery'],
    derivativeWords: ['candy', 'biscuit', 'biscuits', 'cookie', 'chocolate', 'syrup', 'drink', 'free', 'sugar free', 'sugar-free']
  },
  salt: {
    coreTerms: ['salt', 'namak', 'sendha', 'rock salt', 'black salt'],
    intentCategories: ['Oil, Ghee & Salt', 'Salt', 'Salt & Sugar'],
    derivativeWords: ['biscuit', 'biscuits', 'crackers', 'chips', 'namkeen', 'salted peanuts', 'salted kaju']
  },
  butter: {
    coreTerms: ['butter', 'makhan'],
    intentCategories: ['Dairy, Bread & Eggs', 'Butter & Cheese'],
    derivativeWords: ['biscuit', 'cookie', 'cookies', 'butterscotch', 'chips', 'popcorn']
  },
  ghee: {
    coreTerms: ['ghee', 'desi ghee', 'clarified butter'],
    intentCategories: ['Oil, Ghee & Salt', 'Ghee', 'Desi Ghee'],
    derivativeWords: ['biscuit', 'sweets', 'mithai', 'roasted', 'cookies']
  },
  oil: {
    coreTerms: ['oil', 'tel', 'cooking oil', 'mustard oil', 'refined oil', 'soyabean oil', 'sunflower oil'],
    intentCategories: ['Oil, Ghee & Salt', 'Cooking Oil', 'Mustard Oils', 'Refined Oils'],
    derivativeWords: ['hair oil', 'hair serum', 'massage oil', 'baby massage oil', 'pooja oil', 'lamp oil', 'engine oil']
  },
  soap: {
    coreTerms: ['soap', 'soaps', 'sabun', 'bathing bar', 'body wash', 'bathing soap'],
    intentCategories: ['Bath & Body', 'Bar Soaps', 'Soaps & Body Wash'],
    derivativeWords: ['dishwash', 'detergent bar', 'washing powder', 'detergent']
  },
  biscuit: {
    coreTerms: ['biscuit', 'biscuits', 'cookie', 'cookies', 'rusk'],
    intentCategories: ['Bakery & Biscuits', 'Biscuits', 'Cookies', 'Rusk & Khari'],
    derivativeWords: []
  }
};

// Map aliases for all intent variants
CORE_INTENTS.cashew = CORE_INTENTS.kaju;
CORE_INTENTS.cashews = CORE_INTENTS.kaju;
CORE_INTENTS.kajoo = CORE_INTENTS.kaju;
CORE_INTENTS.kajju = CORE_INTENTS.kaju;
CORE_INTENTS.almond = CORE_INTENTS.badam;
CORE_INTENTS.almonds = CORE_INTENTS.badam;
CORE_INTENTS.badaam = CORE_INTENTS.badam;
CORE_INTENTS.pistachio = CORE_INTENTS.pista;
CORE_INTENTS.pistachios = CORE_INTENTS.pista;
CORE_INTENTS.raisin = CORE_INTENTS.kishmish;
CORE_INTENTS.raisins = CORE_INTENTS.kishmish;
CORE_INTENTS.kismis = CORE_INTENTS.kishmish;
CORE_INTENTS.walnut = CORE_INTENTS.akhrot;
CORE_INTENTS.walnuts = CORE_INTENTS.akhrot;
CORE_INTENTS.akrot = CORE_INTENTS.akhrot;
CORE_INTENTS.chawal = CORE_INTENTS.rice;
CORE_INTENTS.basmati = CORE_INTENTS.rice;
CORE_INTENTS.turmeric = CORE_INTENTS.haldi;
CORE_INTENTS.eggs = CORE_INTENTS.egg;
CORE_INTENTS.anda = CORE_INTENTS.egg;
CORE_INTENTS.ande = CORE_INTENTS.egg;
CORE_INTENTS.milk = CORE_INTENTS.doodh;
CORE_INTENTS.tea = CORE_INTENTS.chai;
CORE_INTENTS.daal = CORE_INTENTS.dal;
CORE_INTENTS.chini = CORE_INTENTS.sugar;
CORE_INTENTS.cheeni = CORE_INTENTS.sugar;
CORE_INTENTS.shakkar = CORE_INTENTS.sugar;
CORE_INTENTS.namak = CORE_INTENTS.salt;
CORE_INTENTS.makhan = CORE_INTENTS.butter;
CORE_INTENTS.tel = CORE_INTENTS.oil;
CORE_INTENTS.sabun = CORE_INTENTS.soap;
CORE_INTENTS.soaps = CORE_INTENTS.soap;
CORE_INTENTS.biscuits = CORE_INTENTS.biscuit;
CORE_INTENTS.cookie = CORE_INTENTS.biscuit;
CORE_INTENTS.cookies = CORE_INTENTS.biscuit;

/**
 * Auto-corrects misclassified product category and subCategory based on title and brand heuristics.
 */
function classifyProduct(product) {
  if (!product) return null;
  const name = String(product.name || '').trim();
  const nameLower = name.toLowerCase();
  const currentCat = String(product.category || '').trim();

  const hasWord = (word) => new RegExp(`\\b${word}\\b`, 'i').test(nameLower);

  // 1. ICE CREAMS & FROZEN DESSERTS
  const isIceCream = (
    nameLower.includes('ice cream') ||
    nameLower.includes('ice-cream') ||
    nameLower.includes('icecream') ||
    hasWord('kulfi') ||
    nameLower.includes('ice candy') ||
    nameLower.includes('cornetto') ||
    nameLower.includes('chocobar') ||
    nameLower.includes('cassatta') ||
    nameLower.includes('tricone') ||
    nameLower.includes('frostik')
  );
  if (isIceCream) {
    let sub = 'Ice Creams';
    if (nameLower.includes('cone') || nameLower.includes('bar') || hasWord('kulfi') || nameLower.includes('tricone') || nameLower.includes('frostik')) {
      sub = 'Cones & Bars';
    } else if (nameLower.includes('tub') || nameLower.includes('brick') || nameLower.includes('party pack')) {
      sub = 'Tubs & Bricks';
    } else if (nameLower.includes('candy') || nameLower.includes('stick')) {
      sub = 'Ice Candies';
    }
    return {
      category: 'Ice Creams',
      subCategory: sub,
      section: 'Munchies & Refreshments',
      emoji: '🍦'
    };
  }

  // 2. BEAUTY & GROOMING: SKIN CARE, FACE SCRUBS & LOTIONS
  const isSkinCare = (
    hasWord('scrub') ||
    hasWord('lotion') ||
    hasWord('moisturizer') ||
    hasWord('moisturiser') ||
    nameLower.includes('face scrub') ||
    nameLower.includes('face wash') ||
    nameLower.includes('face cleanser') ||
    nameLower.includes('cleansing milk') ||
    nameLower.includes('body lotion') ||
    nameLower.includes('cold cream') ||
    nameLower.includes('face cream') ||
    nameLower.includes('skin cream') ||
    nameLower.includes('nourishing cream') ||
    nameLower.includes('fairness cream') ||
    nameLower.includes('shaving cream') ||
    nameLower.includes('hair removal') ||
    nameLower.includes('veet') ||
    nameLower.includes('gulabari') ||
    nameLower.includes('anti ageing') ||
    nameLower.includes('anti aging')
  ) && !hasWord('soap') && !hasWord('soaps') && !nameLower.includes('chips') && !nameLower.includes('biscuit') && !nameLower.includes('ice cream') && !nameLower.includes('ice-cream');

  if (isSkinCare) {
    return {
      category: 'Beauty & Grooming',
      subCategory: 'Skin Care & Lotions',
      section: 'Personal & Home Care',
      emoji: '🧴'
    };
  }

  // 2B. BEVERAGES & FLAVOURED MILK
  if (
    nameLower.includes('flavoured milk') ||
    nameLower.includes('flavored milk') ||
    nameLower.includes('milk shake') ||
    nameLower.includes('milkshake') ||
    hasWord('lassi') ||
    hasWord('chaas') ||
    hasWord('buttermilk') ||
    nameLower.includes('amul kool') ||
    nameLower.includes('badam milk') ||
    nameLower.includes('almond milk')
  ) {
    return {
      category: 'Dairy, Bread & Eggs',
      subCategory: 'Milk & Cream',
      section: 'Daily Fresh & Staples',
      emoji: '🥛'
    };
  }

  // 3. HAIR CARE, SHAMPOOS & HAIR OILS
  if (
    nameLower.includes('hair oil') ||
    nameLower.includes('hair serum') ||
    nameLower.includes('hair colour') ||
    nameLower.includes('hair color') ||
    nameLower.includes('hair dye') ||
    nameLower.includes('hair cream') ||
    hasWord('shampoo') ||
    hasWord('conditioner') ||
    nameLower.includes('hair conditioner') ||
    nameLower.includes('kesh king') ||
    nameLower.includes('indulekha') ||
    nameLower.includes('parachute advansed') ||
    nameLower.includes('bajaj almond drop') ||
    nameLower.includes('navratna') ||
    nameLower.includes('dabur amla') ||
    nameLower.includes('anmol gold pure coconut oil') ||
    nameLower.includes('maha bhringraj') ||
    nameLower.includes('streax shine') ||
    nameLower.includes('sunsilk') ||
    nameLower.includes('tresemme') ||
    nameLower.includes('dove hairfall') ||
    nameLower.includes('dove intense repair') ||
    nameLower.includes('dove daily shine') ||
    nameLower.includes('dove dryness care') ||
    nameLower.includes('dove anti-dandruff') ||
    nameLower.includes('head & shoulders') ||
    nameLower.includes('head & shoulder') ||
    nameLower.includes('pantene') ||
    nameLower.includes('vatika henna') ||
    nameLower.includes('kesh kanti')
  ) {
    return {
      category: 'Beauty & Grooming',
      subCategory: 'Hair Care & Oils',
      section: 'Personal & Home Care',
      emoji: '🧴'
    };
  }

  // 4. SWEETS & CHOCOLATES: BARS, CANDIES & INDIAN SWEETS
  const isChocolate = (
    hasWord('chocolate') ||
    hasWord('chocolates') ||
    hasWord('choco') ||
    nameLower.includes('dairy milk') ||
    nameLower.includes('cadbury') ||
    nameLower.includes('bournville') ||
    nameLower.includes('temptations') ||
    hasWord('kitkat') ||
    hasWord('munch') ||
    hasWord('snickers') ||
    nameLower.includes('5 star') ||
    hasWord('perk') ||
    hasWord('gems') ||
    nameLower.includes('ferrero') ||
    hasWord('kinder') ||
    (nameLower.includes('silk') && !nameLower.includes('sunsilk') && !nameLower.includes('dove'))
  );
  if (isChocolate && !nameLower.includes('cake') && !nameLower.includes('biscuit') && !nameLower.includes('cookie') && !nameLower.includes('ice cream')) {
    return {
      category: 'Sweets & Chocolates',
      subCategory: 'Chocolates',
      section: 'Munchies & Refreshments',
      emoji: '🍫'
    };
  }

  const isMithai = (
    nameLower.includes('kaju katli') ||
    nameLower.includes('kaju katri') ||
    nameLower.includes('shrikhand') ||
    nameLower.includes('gulab jamun') ||
    nameLower.includes('rasgulla') ||
    nameLower.includes('soan papdi') ||
    nameLower.includes('besan laddu') ||
    nameLower.includes('besan ladoo') ||
    nameLower.includes('peda') ||
    hasWord('ladoo') ||
    hasWord('laddu') ||
    hasWord('barfi') ||
    hasWord('cham cham') ||
    hasWord('halwa')
  );
  if (isMithai && !nameLower.includes('biscuit') && !nameLower.includes('cookie') && !nameLower.includes('cake')) {
    return {
      category: 'Sweets & Chocolates',
      subCategory: 'Packaged Indian Sweets',
      section: 'Munchies & Refreshments',
      emoji: '🍬'
    };
  }

  // 5. BREAKFAST CEREALS & OATS
  if (
    nameLower.includes('cornflakes') ||
    nameLower.includes('corn flakes') ||
    nameLower.includes('muesli') ||
    nameLower.includes('granola') ||
    hasWord('chocos') ||
    nameLower.includes('froot loops') ||
    nameLower.includes('rolled oats') ||
    nameLower.includes('instant oats') ||
    (hasWord('oats') && !nameLower.includes('biscuit') && !nameLower.includes('cookie'))
  ) {
    return {
      category: 'Breakfast Cereals',
      subCategory: 'Breakfast Cereals',
      section: 'Daily Fresh & Staples',
      emoji: '🥣'
    };
  }

  // 6. JAMS, SPREADS & SAUCES
  if (
    (hasWord('spread') || hasWord('spreads') || nameLower.includes('cocoa spread') || nameLower.includes('chocolate spread') || nameLower.includes('peanut butter') || hasWord('nutella')) &&
    !nameLower.includes('biscuit') &&
    !nameLower.includes('cake')
  ) {
    return {
      category: 'Sauces & Spreads',
      subCategory: 'Jams & Honey',
      section: 'Daily Fresh & Staples',
      emoji: '🍯'
    };
  }

  // 7. HEALTH DRINKS & POWDERS
  if (
    hasWord('complan') ||
    hasWord('horlicks') ||
    hasWord('bournvita') ||
    hasWord('boost') ||
    hasWord('pediasure') ||
    hasWord('ensure') ||
    nameLower.includes('health drink') ||
    nameLower.includes('nutrition drink') ||
    nameLower.includes('malt drink')
  ) {
    return {
      category: 'Tea & Coffee',
      subCategory: 'Health Drinks',
      section: 'Daily Fresh & Staples',
      emoji: '☕'
    };
  }

  // 8. SYRUPS, SHARBATS & SQUASHES
  if (
    hasWord('sharbat') ||
    hasWord('sharbats') ||
    hasWord('thandai') ||
    hasWord('squash') ||
    nameLower.includes('rooh afza') ||
    nameLower.includes('fruit syrup')
  ) {
    return {
      category: 'Drinks & Juices',
      subCategory: 'Syrups & Squashes',
      section: 'Daily Fresh & Staples',
      emoji: '🧃'
    };
  }

  // 9. BAKERY: CAKES, PASTRIES & BISCUITS
  if (
    hasWord('cake') ||
    hasWord('cakes') ||
    hasWord('pastry') ||
    hasWord('muffin') ||
    hasWord('muffins') ||
    hasWord('cupcake') ||
    hasWord('brownie')
  ) {
    return {
      category: 'Bakery & Biscuits',
      subCategory: 'Cakes & Muffins',
      section: 'Munchies & Refreshments',
      emoji: '🧁'
    };
  }

  if (
    hasWord('biscuit') ||
    hasWord('biscuits') ||
    hasWord('biscutes') ||
    hasWord('biscute') ||
    hasWord('cookie') ||
    hasWord('cookies') ||
    hasWord('rusk') ||
    hasWord('khari') ||
    nameLower.includes('parle-g') ||
    nameLower.includes('parle g') ||
    nameLower.includes('good day') ||
    nameLower.includes('moms magic') ||
    nameLower.includes("mom's magic") ||
    nameLower.includes('dark fantasy') ||
    nameLower.includes('hide & seek') ||
    nameLower.includes('hide and seek') ||
    nameLower.includes('bourbon') ||
    (nameLower.includes('oreo') && !nameLower.includes('silk')) ||
    nameLower.includes('monaco') ||
    nameLower.includes('krackjack') ||
    nameLower.includes('marie gold') ||
    nameLower.includes('tiger biscuit') ||
    nameLower.includes('milk bikis') ||
    nameLower.includes('creme biscuit') ||
    nameLower.includes('cream cracker') ||
    nameLower.includes('cheese cracker') ||
    nameLower.includes('kaju bake')
  ) {
    let sub = 'Biscuits';
    if (hasWord('cookie') || hasWord('cookies')) sub = 'Cookies';
    else if (hasWord('rusk') || hasWord('khari')) sub = 'Rusk & Khari';
    return {
      category: 'Bakery & Biscuits',
      subCategory: sub,
      section: 'Munchies & Refreshments',
      emoji: '🍪'
    };
  }

  // 10. CHIPS & NAMKEEN
  if (
    hasWord('namkeen') ||
    hasWord('mixture') ||
    hasWord('bhujia') ||
    hasWord('sev') ||
    hasWord('chips') ||
    hasWord('crisps') ||
    hasWord('kurkure') ||
    hasWord('lays') ||
    hasWord('bingo') ||
    hasWord('uncle chipps') ||
    hasWord('chanachur') ||
    hasWord('gathiya') ||
    hasWord('wafers') ||
    hasWord('farsan')
  ) {
    let sub = 'Traditional Namkeen';
    if (hasWord('chips') || hasWord('crisps') || hasWord('wafers') || hasWord('lays') || hasWord('bingo')) sub = 'Chips & Crisps';
    else if (hasWord('kurkure')) sub = 'Extruded Snacks';
    return {
      category: 'Chips & Namkeen',
      subCategory: sub,
      section: 'Munchies & Refreshments',
      emoji: '🥨'
    };
  }

  // 11. COOKING OILS & GHEE
  const isCookingOil = (
    nameLower.includes('refined oil') ||
    nameLower.includes('mustard oil') ||
    nameLower.includes('sarson tel') ||
    nameLower.includes('sarson ka tel') ||
    nameLower.includes('soyabean oil') ||
    nameLower.includes('sunflower oil') ||
    nameLower.includes('groundnut oil') ||
    nameLower.includes('moongfali oil') ||
    nameLower.includes('cottonseed oil') ||
    nameLower.includes('canola oil') ||
    nameLower.includes('corn oil') ||
    nameLower.includes('rice bran') ||
    nameLower.includes('olive pomace') ||
    nameLower.includes('everyday cooking oil') ||
    (nameLower.includes('cooking oil') && !nameLower.includes('hair')) ||
    (hasWord('ghee') && !nameLower.includes('pooja') && !nameLower.includes('puja') && !nameLower.includes('biscuit'))
  );
  if (isCookingOil) {
    let sub = 'Cooking Oil';
    if (hasWord('ghee')) sub = 'Ghee';
    else if (nameLower.includes('mustard') || nameLower.includes('sarson')) sub = 'Mustard Oils';
    else if (nameLower.includes('refined') || nameLower.includes('sunflower') || nameLower.includes('soyabean') || nameLower.includes('bran')) sub = 'Refined Oils';
    return {
      category: 'Oil, Ghee & Salt',
      subCategory: sub,
      section: 'Daily Fresh & Staples',
      emoji: '🛢️'
    };
  }

  // 12. BATHING SOAPS & BODY WASH
  if (
    (hasWord('soap') || hasWord('soaps') || hasWord('body wash') || hasWord('shower gel') || hasWord('bathing bar')) &&
    !nameLower.includes('dishwash') &&
    !nameLower.includes('detergent') &&
    !nameLower.includes('surf') &&
    !nameLower.includes('rin ')
  ) {
    return {
      category: 'Bath & Body',
      subCategory: 'Bar Soaps',
      section: 'Personal & Home Care',
      emoji: '🧼'
    };
  }

  // 13. TOOTHPASTE & ORAL CARE
  if (
    nameLower.includes('toothpaste') ||
    nameLower.includes('toothbrush') ||
    nameLower.includes('tooth paste') ||
    nameLower.includes('tooth brush') ||
    nameLower.includes('dant kanti') ||
    nameLower.includes('colgate') ||
    nameLower.includes('pepsodent') ||
    nameLower.includes('sensodyne') ||
    nameLower.includes('close up') ||
    nameLower.includes('closeup') ||
    nameLower.includes('mouthwash')
  ) {
    return {
      category: 'Bath & Body',
      subCategory: 'Oral Care',
      section: 'Personal & Home Care',
      emoji: '🪥'
    };
  }

  // 14. CLEANERS, DETERGENTS & DISHWASH
  if (
    nameLower.includes('detergent') ||
    nameLower.includes('washing powder') ||
    nameLower.includes('surf excel') ||
    nameLower.includes('ariel') ||
    nameLower.includes('tide') ||
    nameLower.includes('wheel detergent') ||
    nameLower.includes('ghadi detergent') ||
    nameLower.includes('rin bar') ||
    nameLower.includes('rin liquid') ||
    nameLower.includes('comfort fabric') ||
    nameLower.includes('fabric conditioner') ||
    nameLower.includes('dishwash') ||
    nameLower.includes('vim bar') ||
    nameLower.includes('vim liquid') ||
    nameLower.includes('pril') ||
    nameLower.includes('exo dish') ||
    nameLower.includes('harpic') ||
    nameLower.includes('lizol') ||
    nameLower.includes('colin') ||
    nameLower.includes('floor cleaner') ||
    nameLower.includes('toilet cleaner') ||
    nameLower.includes('liquid detergent')
  ) {
    let sub = 'Laundry Care';
    if (nameLower.includes('toilet')) sub = 'Toilet Cleaners';
    else if (nameLower.includes('dishwash') || nameLower.includes('vim') || nameLower.includes('pril') || nameLower.includes('exo')) sub = 'Dishwash';
    else if (nameLower.includes('lizol') || nameLower.includes('colin') || nameLower.includes('floor')) sub = 'Floor & Surface Cleaners';
    return {
      category: 'Cleaners & Repellents',
      subCategory: sub,
      section: 'Personal & Home Care',
      emoji: '🧹'
    };
  }

  // 15. PURE DRY FRUITS & NUTS
  const isPureDryFruitWord = (
    hasWord('cashew') || hasWord('cashews') || hasWord('kaju') ||
    hasWord('almond') || hasWord('almonds') || hasWord('badam') ||
    hasWord('raisin') || hasWord('raisins') || hasWord('kishmish') || hasWord('kismis') || hasWord('darkh') ||
    hasWord('walnut') || hasWord('walnuts') || hasWord('akhrot') ||
    hasWord('pistachio') || hasWord('pistachios') || hasWord('pista') ||
    hasWord('anjeer') || hasWord('anjir') || hasWord('fig') || hasWord('figs') ||
    hasWord('khajoor') || hasWord('khajur') || hasWord('dates') ||
    hasWord('makhana') || hasWord('foxnut') || hasWord('lotus seeds') ||
    hasWord('chia seeds') || hasWord('pumpkin seeds') || hasWord('sunflower seeds') || hasWord('flax seeds')
  );

  const isDerivativeOrNonDryFruit = (
    nameLower.includes('shake') ||
    nameLower.includes('chikki') ||
    nameLower.includes('hair') ||
    nameLower.includes('oil') ||
    nameLower.includes('scrub') ||
    nameLower.includes('soap') ||
    nameLower.includes('cream') ||
    nameLower.includes('lotion') ||
    nameLower.includes('nourishing') ||
    nameLower.includes('biscuit') ||
    nameLower.includes('cookie') ||
    nameLower.includes('cake') ||
    nameLower.includes('curry') ||
    nameLower.includes('masala') ||
    nameLower.includes('chocolate') ||
    nameLower.includes('cereal') ||
    nameLower.includes('cornflakes') ||
    nameLower.includes('muesli') ||
    nameLower.includes('spread') ||
    nameLower.includes('drink') ||
    nameLower.includes('sharbat') ||
    nameLower.includes('milk') ||
    nameLower.includes('lassi') ||
    nameLower.includes('chaas') ||
    nameLower.includes('chyawanprash')
  );

  if (isPureDryFruitWord && !isDerivativeOrNonDryFruit) {
    let sub = 'Almonds & Cashews';
    if (hasWord('raisin') || hasWord('raisins') || hasWord('kishmish') || hasWord('kismis') || hasWord('darkh') || hasWord('anjeer') || hasWord('anjir') || hasWord('fig') || hasWord('figs') || hasWord('dates') || hasWord('khajoor')) {
      sub = 'Raisins & Figs';
    } else if (hasWord('walnut') || hasWord('walnuts') || hasWord('akhrot') || hasWord('pista') || hasWord('pistachio')) {
      sub = 'Pistachios Walnuts';
    } else if (hasWord('seeds') || hasWord('makhana')) {
      sub = 'Seeds & Mixes';
    }
    return {
      category: 'Dry Fruits & Cereals',
      subCategory: sub,
      section: 'Daily Fresh & Staples',
      emoji: '🥜'
    };
  }

  // 16. POOJA NEEDS
  if (
    nameLower.includes('agarbatti') ||
    nameLower.includes('dhoop') ||
    nameLower.includes('incense') ||
    nameLower.includes('camphor') ||
    nameLower.includes('kapoor') ||
    nameLower.includes('cotton wicks') ||
    nameLower.includes('hawan samagri') ||
    nameLower.includes('pooja oil') ||
    nameLower.includes('puja') ||
    nameLower.includes('pooja')
  ) {
    let sub = 'Agarbatti & Dhoop';
    if (nameLower.includes('camphor') || nameLower.includes('kapoor') || nameLower.includes('wick')) sub = 'Camphor & Cotton Wicks';
    else if (nameLower.includes('oil') || nameLower.includes('ghee')) sub = 'Pooja Oil & Ghee';
    return {
      category: 'Pooja Needs',
      subCategory: sub,
      section: 'Personal & Home Care',
      emoji: '🪔'
    };
  }

  // 17. STATIONERY & OFFICE
  if (
    nameLower.includes('pen ') ||
    nameLower.includes('ball pen') ||
    nameLower.includes('gel pen') ||
    nameLower.includes('pencil') ||
    nameLower.includes('eraser') ||
    nameLower.includes('sharpener') ||
    nameLower.includes('notebook') ||
    nameLower.includes('register') ||
    nameLower.includes('fevicol') ||
    nameLower.includes('fevikwik') ||
    nameLower.includes('tape') ||
    nameLower.includes('scissors') ||
    nameLower.includes('stapler') ||
    nameLower.includes('crayons') ||
    nameLower.includes('sketch pen')
  ) {
    return {
      category: 'Home & Office',
      subCategory: 'Stationery',
      section: 'Personal & Home Care',
      emoji: '✏️'
    };
  }

  // 18. Fix catch-all categories
  if (['Daily Essentials', 'Grocery & Essentials', 'Atta, Rice & Dal', 'NO_CATEGORY', 'Oil & Ghee'].includes(currentCat)) {
    if (nameLower.includes('atta') || nameLower.includes('flour') || nameLower.includes('maida') || nameLower.includes('sooji') || nameLower.includes('suji') || nameLower.includes('besan')) {
      return { category: 'Atta & Rice', subCategory: nameLower.includes('atta') ? 'Atta' : 'Besan, Maida & Suji', section: 'Daily Fresh & Staples', emoji: '🌾' };
    }
    if (nameLower.includes('rice') || nameLower.includes('chawal') || nameLower.includes('basmati')) {
      return { category: 'Atta & Rice', subCategory: nameLower.includes('basmati') ? 'Basmati Rice' : 'Daily Rice', section: 'Daily Fresh & Staples', emoji: '🍚' };
    }
    if (nameLower.includes('dal') || nameLower.includes('chana') || nameLower.includes('rajma') || nameLower.includes('moong') || nameLower.includes('urad') || nameLower.includes('toor') || nameLower.includes('masoor')) {
      return { category: 'Dals & Pulses', subCategory: 'Mix Dal & Other Pulses', section: 'Daily Fresh & Staples', emoji: '🥣' };
    }
    if (nameLower.includes('oil') || nameLower.includes('tel') || nameLower.includes('ghee') || nameLower.includes('salt') || nameLower.includes('namak')) {
      return { category: 'Oil, Ghee & Salt', subCategory: nameLower.includes('ghee') ? 'Ghee' : (nameLower.includes('salt') || nameLower.includes('namak') ? 'Salt' : 'Cooking Oil'), section: 'Daily Fresh & Staples', emoji: '🛢️' };
    }
    if (nameLower.includes('masala') || nameLower.includes('haldi') || nameLower.includes('mirch') || nameLower.includes('dhaniya') || nameLower.includes('jeera')) {
      return { category: 'Spices & Condiments', subCategory: 'Blended Masalas', section: 'Daily Fresh & Staples', emoji: '🌶️' };
    }
  }

  return null;
}

/**
 * Normalizes plural/stem forms of words
 */
function normalizeStem(word) {
  if (!word || typeof word !== 'string') return '';
  let str = word.toLowerCase().trim();

  if (str === 'cashews') return 'cashew';
  if (str === 'biscuits' || str === 'biscutes' || str === 'biscute') return 'biscuit';
  if (str === 'cookies') return 'cookie';
  if (str === 'eggs') return 'egg';
  if (str === 'potatoes') return 'potato';
  if (str === 'tomatoes') return 'tomato';
  if (str === 'noodles') return 'noodle';
  if (str === 'chips') return 'chip';
  if (str === 'chocolates') return 'chocolate';
  if (str === 'bottles') return 'bottle';
  if (str === 'packets' || str === 'pkts' || str === 'pkt') return 'packet';
  if (str === 'bars') return 'bar';
  if (str === 'soaps') return 'soap';
  if (str === 'pulses') return 'pulse';
  if (str === 'lentils') return 'lentil';
  if (str === 'leaves') return 'leaf';
  if (str === 'seeds') return 'seed';
  if (str === 'walnuts') return 'walnut';
  if (str === 'almonds') return 'almond';
  if (str === 'raisins') return 'raisin';
  if (str === 'figs') return 'fig';
  if (str === 'dates') return 'date';
  if (str === 'peas') return 'pea';

  if (str.length > 3 && str.endsWith('s') && !str.endsWith('ss') && !str.endsWith('us') && !str.endsWith('is')) {
    return str.slice(0, -1);
  }

  return str;
}

/**
 * Fast Levenshtein distance check with early bail-out
 */
function levenshteinDistance(s1, s2) {
  if (s1 === s2) return 0;
  const l1 = s1.length;
  const l2 = s2.length;
  if (Math.abs(l1 - l2) > 2) return 99;

  const d = [];
  for (let i = 0; i <= l1; i++) d[i] = [i];
  for (let j = 0; j <= l2; j++) d[0][j] = j;

  for (let i = 1; i <= l1; i++) {
    for (let j = 1; j <= l2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + cost
      );
    }
  }
  return d[l1][l2];
}

/**
 * Normalizes common Hinglish transliteration variations
 */
function normalizeHinglishPhonetics(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .replace(/oo+/g, 'u')
    .replace(/ee+/g, 'i')
    .replace(/aa+/g, 'a')
    .replace(/([bcdfghjklmnpqrstvwxyz])\1+/g, '$1');
}

/**
 * Checks if a token matches target word (exact, stemmed, or fuzzy typo)
 */
function tokenMatches(queryTok, targetWord) {
  if (!queryTok || !targetWord) return false;
  const qLower = queryTok.toLowerCase();
  const tLower = targetWord.toLowerCase();

  // 1. Exact match
  if (qLower === tLower) return true;

  // 2. Stem match
  const qStem = normalizeStem(qLower);
  const tStem = normalizeStem(tLower);
  if (qStem === tStem) return true;

  // 3. Hinglish phonetic match
  const qPhon = normalizeHinglishPhonetics(qStem);
  const tPhon = normalizeHinglishPhonetics(tStem);
  if (qPhon === tPhon) return true;

  // 4. Strict typo matching:
  if (qStem[0] !== tStem[0]) return false;

  const minLen = Math.min(qStem.length, tStem.length);
  if (minLen < 5) return false;

  const lenDiff = Math.abs(qStem.length - tStem.length);
  if (lenDiff > 1) return false;

  const maxDistance = minLen >= 7 ? 2 : 1;
  if (levenshteinDistance(qStem, tStem) <= maxDistance) return true;
  if (levenshteinDistance(qPhon, tPhon) <= maxDistance) return true;

  return false;
}

/**
 * Checks if a word is a whole-word match or exact stem match in target text
 */
function matchesWordInText(needle, haystackWords) {
  const nLower = needle.toLowerCase();
  const nStem = normalizeStem(nLower);

  for (const w of haystackWords) {
    const wLower = w.toLowerCase();
    if (nLower === 'haldi' && wLower.startsWith('haldiram')) continue;
    if (nLower === 'anda' && (wLower.includes('chandan') || wLower.includes('standard'))) continue;

    if (wLower === nLower) return true;
    if (normalizeStem(wLower) === nStem) return true;
    if (tokenMatches(nLower, wLower)) return true;
  }
  return false;
}

/**
 * Checks if a synonym (single-word or multi-word phrase) matches in product text
 */
function matchesSynonymInProduct(syn, productHaystack, productWords) {
  const sLower = syn.toLowerCase();
  if (sLower.includes(' ')) {
    if (productHaystack.includes(sLower)) return true;
    const synWords = sLower.split(/\s+/).filter(Boolean);
    if (synWords.every(sw => productWords.includes(sw) || productWords.includes(normalizeStem(sw)))) {
      return true;
    }
    return false;
  }

  if (sLower === 'haldi' && productHaystack.includes('haldiram') && !productHaystack.match(/\bhaldi\b/)) {
    return false;
  }
  if (sLower === 'anda' && !productHaystack.match(/\b(anda|ande|egg|eggs)\b/)) {
    return false;
  }

  const sStem = normalizeStem(sLower);
  if (productWords.includes(sLower) || productWords.includes(sStem)) return true;

  const sPhon = normalizeHinglishPhonetics(sStem);
  for (const pw of productWords) {
    if (normalizeHinglishPhonetics(normalizeStem(pw)) === sPhon) return true;
    if (tokenMatches(sLower, pw)) return true;
  }

  return false;
}

/**
 * Escapes regex special characters
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Expands a query string into primary tokens, multi-word phrases, and all applicable synonyms
 */
function expandQueryTokens(queryString) {
  const q = String(queryString || '').toLowerCase().trim();
  if (!q) {
    return {
      rawTokens: [],
      expandedTokens: new Set(),
      tokenSynonymMap: new Map(),
      phraseMatches: [],
      intent: null,
      queryLower: ''
    };
  }

  const rawTokens = q.split(/\s+/).filter(Boolean);
  const expandedTokens = new Set();
  const tokenSynonymMap = new Map();
  const phraseMatches = [];
  let detectedIntent = null;

  // 1. Detect multi-word phrases in query
  for (const item of PHRASE_SYNONYMS) {
    if (q.includes(item.phrase)) {
      phraseMatches.push(item.phrase);
      const pSyns = new Set(item.synonyms);
      tokenSynonymMap.set(item.phrase, pSyns);
      item.synonyms.forEach(s => {
        expandedTokens.add(s);
        expandedTokens.add(normalizeStem(s));
      });
      if (!detectedIntent && CORE_INTENTS[item.phrase]) {
        detectedIntent = CORE_INTENTS[item.phrase];
      }
    }
  }

  // 2. Expand individual tokens
  for (const tok of rawTokens) {
    const stem = normalizeStem(tok);
    const phon = normalizeHinglishPhonetics(tok);
    const phonStem = normalizeStem(phon);

    expandedTokens.add(tok);
    expandedTokens.add(stem);
    expandedTokens.add(phon);
    expandedTokens.add(phonStem);

    const thisTokenSyns = new Set([tok, stem, phon, phonStem]);

    let syns = SYNONYM_MAP[tok] || SYNONYM_MAP[stem] || SYNONYM_MAP[phon] || SYNONYM_MAP[phonStem];
    if (!syns) {
      for (const key of Object.keys(SYNONYM_MAP)) {
        if (tokenMatches(tok, key) || tokenMatches(stem, key) || tokenMatches(phon, key)) {
          syns = SYNONYM_MAP[key];
          thisTokenSyns.add(key);
          expandedTokens.add(key);
          break;
        }
      }
    }
    if (syns) {
      syns.forEach(s => {
        thisTokenSyns.add(s);
        expandedTokens.add(s);
        const sStem = normalizeStem(s);
        thisTokenSyns.add(sStem);
        expandedTokens.add(sStem);
      });
    }

    tokenSynonymMap.set(tok, thisTokenSyns);

    if (!detectedIntent) {
      const intentCand = CORE_INTENTS[tok] || CORE_INTENTS[stem] || CORE_INTENTS[phon] || CORE_INTENTS[phonStem];
      if (intentCand) {
        detectedIntent = intentCand;
      } else {
        for (const [intentKey, intentObj] of Object.entries(CORE_INTENTS)) {
          if (tokenMatches(tok, intentKey) || tokenMatches(stem, intentKey) || tokenMatches(phon, intentKey)) {
            detectedIntent = intentObj;
            break;
          }
        }
      }
    }
  }

  if (!detectedIntent && CORE_INTENTS[q]) {
    detectedIntent = CORE_INTENTS[q];
  }

  return {
    rawTokens,
    expandedTokens,
    tokenSynonymMap,
    phraseMatches,
    intent: detectedIntent,
    queryLower: q
  };
}

/**
 * Computes intelligent search score and ranking for a product
 */
function calculateGroceryRelevance(product, queryContext) {
  const { rawTokens, expandedTokens, tokenSynonymMap, phraseMatches, intent } = queryContext;
  if (!rawTokens || rawTokens.length === 0) return 0;

  const nameLower = String(product.name || '').toLowerCase();
  const brandLower = String(product.brand || '').toLowerCase();
  const catLower = String(product.category || '').toLowerCase();
  const subLower = String(product.subCategory || '').toLowerCase();
  const barcodeStr = String(product.barcode || '').toLowerCase();
  const tagsStr = Array.isArray(product.searchTags)
    ? product.searchTags.join(' ').toLowerCase()
    : String(product.searchTags || '').toLowerCase();

  const productHaystack = `${nameLower} ${brandLower} ${barcodeStr} ${tagsStr}`;
  const productWords = productHaystack.split(/[^a-z0-9]+/i).filter(Boolean);
  const categoryHaystack = `${catLower} ${subLower}`;

  const coveredTokens = new Set();
  if (phraseMatches && phraseMatches.length > 0) {
    for (const p of phraseMatches) {
      const pSyns = tokenSynonymMap.get(p);
      if (pSyns) {
        const pMatched = Array.from(pSyns).some(syn => matchesSynonymInProduct(syn, productHaystack, productWords));
        if (pMatched) {
          p.split(/\s+/).forEach(tok => coveredTokens.add(tok));
        }
      }
    }
  }

  const remainingTokens = rawTokens.filter(tok => !coveredTokens.has(tok));
  const allMatched = remainingTokens.every(tok => {
    if ((tok === 'egg' || tok === 'eggs' || tok === 'anda' || tok === 'ande') && product.isVeg === true) {
      const hasEggInTitle = nameLower.includes('egg') || nameLower.includes('anda');
      if (!hasEggInTitle) return false;
    }

    const tokSyns = (tokenSynonymMap && tokenSynonymMap.get(tok)) || new Set([tok]);
    const matched = Array.from(tokSyns).some(syn => matchesSynonymInProduct(syn, productHaystack, productWords));
    if (matched) return true;

    const isCategoryKeyword = /^(category|groceries|grocery|staples|spices|masala|dry fruits|snacks|namkeen|beverages|drinks|cleaners|sweets|bakery|dairy|household|frozen)$/i.test(tok);
    if (isCategoryKeyword && categoryHaystack.includes(tok)) return true;

    return false;
  });

  if (!allMatched) return -1;

  let score = 50;
  const fullQueryLower = rawTokens.join(' ');

  if (barcodeStr && barcodeStr === fullQueryLower) score += 400;

  if (nameLower === fullQueryLower) score += 250;
  else if (nameLower.startsWith(fullQueryLower)) score += 180;
  else if (nameLower.includes(fullQueryLower)) score += 100;

  let nameTokenHits = 0;
  if (expandedTokens) {
    for (const expTok of expandedTokens) {
      if (nameLower.includes(expTok)) {
        nameTokenHits++;
      }
    }
  }
  score += Math.min(nameTokenHits * 40, 160);

  if (brandLower === fullQueryLower || brandLower.startsWith(fullQueryLower)) score += 60;
  if (catLower.includes(fullQueryLower)) score += 40;
  if (subLower.includes(fullQueryLower)) score += 50;
  if (tagsStr.includes(fullQueryLower)) score += 30;

  if (product.inStock !== false) score += 20;
  if (product.isFeatured) score += 10;

  if (intent) {
    const isIntentCategory = intent.intentCategories.some(ic =>
      catLower.includes(ic.toLowerCase()) || subLower.includes(ic.toLowerCase())
    );

    const hasDerivativeWordInTitle = intent.derivativeWords.some(dw =>
      new RegExp(`\\b${escapeRegex(dw)}\\b`, 'i').test(nameLower) ||
      (dw.includes(' ') && nameLower.includes(dw.toLowerCase()))
    );

    const isSecondaryCategory = (
      catLower.includes('bakery') ||
      catLower.includes('biscuit') ||
      catLower.includes('chips') ||
      catLower.includes('namkeen') ||
      catLower.includes('ice cream') ||
      catLower.includes('sweets') ||
      catLower.includes('breakfast cereal') ||
      catLower.includes('spices') ||
      catLower.includes('sauce') ||
      catLower.includes('spread') ||
      catLower.includes('beauty') ||
      catLower.includes('bath')
    ) && !isIntentCategory;

    const isDerivativeProduct = hasDerivativeWordInTitle || isSecondaryCategory;

    const userExplicitlyAskedForDerivative = intent.derivativeWords.some(dw =>
      fullQueryLower.includes(dw.toLowerCase())
    );

    const hasCoreTerm = intent.coreTerms.some(ct =>
      nameLower.includes(ct.toLowerCase())
    );

    if (userExplicitlyAskedForDerivative) {
      if (isDerivativeProduct) {
        score += 200;
      }
    } else {
      if (isIntentCategory && hasCoreTerm && !isDerivativeProduct) {
        score += 350;
      } else if (isDerivativeProduct) {
        score = Math.max(10, score - 150);
      } else if (isIntentCategory) {
        score += 150;
      }
    }
  }

  return score;
}

export {
  SYNONYM_MAP,
  CORE_INTENTS,
  normalizeStem,
  normalizeHinglishPhonetics,
  levenshteinDistance,
  tokenMatches,
  matchesWordInText,
  matchesSynonymInProduct,
  escapeRegex,
  expandQueryTokens,
  calculateGroceryRelevance,
  classifyProduct
};

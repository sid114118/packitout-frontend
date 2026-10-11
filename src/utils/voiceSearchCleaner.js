// Smart Voice Search & Grocery Intent Cleaner for PackItOut
// Specifically crafted for Indian Hyperlocal & Kirana shopping patterns (English, Hindi, Hinglish)

// 🛡️ Known compound brands/products where numbers or words must NOT be stripped as generic quantities
const PROTECTED_PHRASES = [
  { regex: /\b(five|5)\s*(star|stars)\b/gi, replacement: "5 star" },
  { regex: /\b(seven|7)\s*(up)\b/gi, replacement: "7 up" },
  { regex: /\b(twenty|20)[\s-]*(twenty|20)\b/gi, replacement: "20 20" },
  { regex: /\b(parle)\s*(g)\b/gi, replacement: "parle g" },
  { regex: /\b(kinder)\s*(joy)\b/gi, replacement: "kinder joy" },
  { regex: /\b(surf)\s*(excel)\b/gi, replacement: "surf excel" },
  { regex: /\b(red)\s*(label)\b/gi, replacement: "red label" },
  { regex: /\b(taj)\s*(mahal)\b/gi, replacement: "taj mahal" },
  { regex: /\b(minute)\s*(maid)\b/gi, replacement: "minute maid" },
  { regex: /\b(coca|coke)\s*(cola)?\b/gi, replacement: "coca cola" },
  { regex: /\b(mountain)\s*(dew)\b/gi, replacement: "mountain dew" },
];

// 🎙️ Conversational filler phrases & shopkeeper honorifics
const FILLER_PHRASES = [
  // Greetings / Shopkeeper address
  /\b(bhaiya\s*ji|bhaiyaji|bhaiya|bhaya|bhai|uncle\s*ji|uncleji|uncle|dada|boss|bhaijaan)\b/gi,
  /\b(hello|hey|hi|namaste|pranam|suno\s*ji|sunoji|suno|arre)\b/gi,
  /\b(kripya\s*karke|kripya|please|zara|ek\s*baar|zara\s*sa)\b/gi,

  // Request / Intent verbs (Hinglish / Hindi in Latin script)
  /\b(chahiye|chaiye|chaahiye|chahiye\s*hai|chahiye\s*tha)\b/gi,
  /\b(dedo|de\s*do|dena|de\s*na|bhej\s*do|bhej\s*dena|lao|le\s*aao|mangwa\s*do)\b/gi,
  /\b(dikhao|dikhana|search\s*karo|dhundo|khojo|pack\s*karo)\b/gi,

  // Request / Intent verbs (English)
  /\b(i\s*want|i\s*need|want\s*to\s*buy|want|need|give\s*me|get\s*me|bring\s*me)\b/gi,
  /\b(show\s*me|find\s*me|find|search\s*for|search|look\s*for|can\s*i\s*get|buy)\b/gi,

  // Subject pronouns & articles
  /\b(mujhe|hume|humko|humey|mere\s*ko|mereko|apne\s*ko|kuch|koyi|kisi)\b/gi,
  /\b(the|a|an)\b/gi,

  // Relational particles (e.g. "Amul ka doodh" -> "Amul doodh", "Lays wala" -> "Lays")
  /\b(ka|ki|ke|wale|wali|wala|waley)\b/gi,
];

// ⚖️ Attached quantities and units (e.g. 5kg, 500g, 1ltr, 200ml)
const ATTACHED_QUANTITY_REGEX = /\b\d+(\.\d+)?\s*(kilograms?|kilos?|kgs?|kg|grams?|gms?|gm|g|litres?|liters?|ltrs?|ltr|l|millilitres?|milliliters?|ml|packets?|pkts?|pkt|pouches?|pouch|bottles?|boxes?|pieces?|pcs?|darjan|dozens?)\b/gi;

// 📦 Packaging & Container units
const PACKAGING_WORDS = [
  /\b(packets?|pkts?|pkt|pouch|pouches|bars?|bottles?|btl|cans?|tins?)\b/gi,
  /\b(dabba|dappe|dibba|boxes?|cartons?|packs?|piece|pieces|pcs?)\b/gi,
];

// ⚖️ Standalone measurement units
const MEASUREMENT_UNITS = [
  /\b(kilograms?|kilos?|kgs?|kg)\b/gi,
  /\b(grams?|gms?|gm)\b/gi,
  /\b(litres?|liters?|ltrs?|ltr)\b/gi,
  /\b(millilitres?|milliliters?|ml)\b/gi,
  /\b(dozens?|darjan)\b/gi,
];

// 🔢 Spoken numbers in Hindi & English when preceding quantities
const NUMBER_WORDS = [
  /\b(ek|do|teen|chaar|char|paanch|panch|che|chhe|saat|aath|ath|nau|das)\b/gi,
  /\b(aadha|adhaa|adha|paav|pao|sawa|dedh|dhai)\b/gi,
  /\b(one|two|three|four|five|six|seven|eight|nine|ten|half)\b/gi,
];

// Devanagari Hindi filler words (if user speaks in pure Hindi)
const DEVANAGARI_FILLERS = [
  /\b(भैया\s*जी|भैया|अंकल|नमस्ते|कृपया|प्लीज|सुनो)\b/gu,
  /\b(चाहिए|दे\s*दो|देदो|देना|दिखाओ|लाओ|भेज\s*दो|ढूंढो)\b/gu,
  /\b(मुझे|हमें|हमको|मेरे\s*को|कुछ)\b/gu,
  /\b(का|की|के|वाला|वाली|वाले)\b/gu,
  /\b(पैकेट|डिब्बा|बोतल|पीस|लीटर|किलो|ग्राम|दर्जन|आधा)\b/gu,
  /\b(एक|दो|तीन|चार|पांच|छह|सात|आठ|नौ|दस)\b/gu,
];

// Common Devanagari to English/Hinglish grocery keyword mappings for maximum search recall
const DEVANAGARI_KEYWORD_MAP = {
  "दूध": "doodh milk",
  "आटा": "atta aashirvaad",
  "चावल": "rice chawal",
  "चीनी": "sugar cheeni",
  "शक्कर": "sugar cheeni",
  "नमक": "salt namak tata",
  "तेल": "oil tel fortune",
  "घी": "ghee amul",
  "चाय": "tea chai",
  "कॉफी": "coffee",
  "बिस्कुट": "biscuit",
  "साबुन": "soap",
  "शैम्पू": "shampoo",
  "दाल": "dal pulses",
  "अंडे": "egg anda",
  "अंडा": "egg anda",
  "मक्खन": "butter amul",
  "दही": "curd dahi",
  "ब्रेड": "bread",
  "मैगी": "maggi noodles",
  "चिप्स": "chips lays",
  "पानी": "water",
  "मसाला": "masala",
  "हल्दी": "haldi turmeric",
  "मिर्च": "mirch chilli",
  "धनिया": "dhaniya",
};

/**
 * Checks if the browser or platform supports SpeechRecognition
 */
export const isSpeechRecognitionSupported = () => {
  if (typeof window === 'undefined') return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
};

/**
 * Creates and initializes a native SpeechRecognition instance
 */
export const createSpeechRecognition = ({ lang = 'en-IN' } = {}) => {
  if (!isSpeechRecognitionSupported()) return null;
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;
  recognition.lang = lang;
  return recognition;
};

/**
 * Smart Cleaner that extracts the pure product / brand intent from raw voice transcripts
 * @param {string} rawSpeech - What the speech engine recognized
 * @returns {{ clean: string, raw: string, isModified: boolean }}
 */
export const cleanVoiceSearchQuery = (rawSpeech = "") => {
  if (!rawSpeech || typeof rawSpeech !== "string") {
    return { clean: "", raw: "", isModified: false };
  }

  const trimmedRaw = rawSpeech.trim();
  let text = trimmedRaw.toLowerCase();

  // 1. Remove punctuation first except letters, numbers, spaces
  text = text.replace(/[.,/#!$%^&*;:{}=\-_`~()?"'–—]/g, " ");

  // 2. Protect compound brands with safe alphanumeric tokens
  const restoredMap = {};
  PROTECTED_PHRASES.forEach(({ regex, replacement }, index) => {
    const token = `PROTECTEDBRANDTOKEN${index}XYZ`;
    if (regex.test(text)) {
      text = text.replace(regex, token);
      restoredMap[token] = replacement;
    }
  });

  // 3. Remove attached quantities like 5kg, 500g, 1ltr, 2packet
  text = text.replace(ATTACHED_QUANTITY_REGEX, " ");

  // 4. Strip conversational greetings, honorifics, and intent verbs
  FILLER_PHRASES.forEach(pattern => {
    text = text.replace(pattern, " ");
  });

  // 5. Strip packaging terms (packet, box, bottle, etc.)
  PACKAGING_WORDS.forEach(pattern => {
    text = text.replace(pattern, " ");
  });

  // 6. Strip standalone measurement units (kg, litre, gram, etc.)
  MEASUREMENT_UNITS.forEach(pattern => {
    text = text.replace(pattern, " ");
  });

  // 7. Strip number words (ek, do, teen, one, two, etc.)
  NUMBER_WORDS.forEach(pattern => {
    text = text.replace(pattern, " ");
  });

  // 8. Strip standalone numbers
  text = text.replace(/\b\d+(\.\d+)?\b/g, " ");

  // 9. Strip Devanagari fillers if spoken in pure Hindi
  DEVANAGARI_FILLERS.forEach(pattern => {
    text = text.replace(pattern, " ");
  });

  // 10. Restore protected brands
  Object.keys(restoredMap).forEach(token => {
    text = text.replace(new RegExp(token, "g"), restoredMap[token]);
  });

  // 11. Check if any remaining Devanagari words match common grocery keywords
  Object.keys(DEVANAGARI_KEYWORD_MAP).forEach(devWord => {
    if (text.includes(devWord)) {
      text = text.replace(new RegExp(devWord, "g"), DEVANAGARI_KEYWORD_MAP[devWord]);
    }
  });

  // 12. Normalize multiple spaces and trim
  const cleaned = text.replace(/\s+/g, " ").trim();

  // If the cleaning removed everything, fall back gracefully to the raw input
  if (!cleaned || cleaned.length === 0) {
    return {
      clean: trimmedRaw,
      raw: trimmedRaw,
      isModified: false
    };
  }

  return {
    clean: cleaned,
    raw: trimmedRaw,
    isModified: cleaned.toLowerCase() !== trimmedRaw.toLowerCase()
  };
};

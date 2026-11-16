import React, { useState, useEffect, useRef, useMemo } from 'react';
import { shopFetch } from '../../utils/api.js';
import { cdnImage } from '../../utils/cloudinaryUrl.js';
import { useToast } from '../../ui/DialogProvider.jsx';
import {
  buildPosCounterBillWhatsApp,
  openWhatsAppChat,
  getPublicBillUrl,
  getShopStorefrontUrl,
} from '../../utils/whatsappShare.js';
import {
  sendBillToCustomerWhatsApp,
  downloadReceiptPdf,
  createReceiptPdfFile,
  downloadFileBlob,
  extractKhataMeta,
} from '../../utils/billReceiptGenerator.js';

const LOOSE_PRESETS = [
  { label: '🍬 Sugar (Chini)', name: 'Loose Sugar (Chini)', qnty: '1 kg', emoji: '🍬', defaultPrice: 44 },
  { label: '🌾 Chakki Atta', name: 'Loose Chakki Atta', qnty: '1 kg', emoji: '🌾', defaultPrice: 38 },
  { label: '🍚 Loose Rice', name: 'Loose Basmati Rice', qnty: '1 kg', emoji: '🍚', defaultPrice: 65 },
  { label: '🫘 Toor / Moong Dal', name: 'Loose Toor / Moong Dal', qnty: '1 kg', emoji: '🫘', defaultPrice: 140 },
  { label: '🥔 Aloo & Pyaz', name: 'Potatoes & Onions', qnty: '1 kg', emoji: '🥔', defaultPrice: 30 },
  { label: '🥦 Fresh Veggies', name: 'Fresh Vegetables', qnty: '1 lot', emoji: '🥦', defaultPrice: 50 },
  { label: '🥛 Loose Milk/Curd', name: 'Dairy / Milk Pouch', qnty: '1 pkt', emoji: '🥛', defaultPrice: 33 },
  { label: '🧈 Oil / Ghee', name: 'Loose Oil / Ghee', qnty: '1 L', emoji: '🧈', defaultPrice: 135 },
  { label: '🍞 Bakery / Bread', name: 'Fresh Bread / Pav', qnty: '1 pkt', emoji: '🍞', defaultPrice: 25 },
  { label: '🛍️ General Kirana', name: 'General Kirana Item', qnty: '1 unit', emoji: '🛍️', defaultPrice: '' },
];

const QUICK_WEIGHTS = [
  { label: '100g', factor: 0.1, tag: '100 gm' },
  { label: '250g', factor: 0.25, tag: '250 gm' },
  { label: '500g', factor: 0.5, tag: '500 gm' },
  { label: '1 kg', factor: 1, tag: '1 kg' },
  { label: '2 kg', factor: 2, tag: '2 kg' },
  { label: '5 kg', factor: 5, tag: '5 kg' },
];

export default function CounterPosTab({
  shopData,
  masterCatalog = [],
  orders = [],
  onBillCreated,
  khataSummary = null,
  onOpenKhataBook = null,
  onKhataChanged = null,
}) {
  const toast = useToast();
  const posEnabled = Boolean(shopData?.canUseCounterPos);

  // --- LIVE BILL STATE ---
  const [billItems, setBillItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [discountAmount, setDiscountAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH'); // CASH | UPI | KHATA
  const [cashTendered, setCashTendered] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerLookup, setCustomerLookup] = useState(null);
  const [isLookingUpCustomer, setIsLookingUpCustomer] = useState(false);
  const [redeemCoins, setRedeemCoins] = useState(false);

  // --- SPLIT KHATA & QUICK SETTLE STATE ---
  const [khataSplitEnabled, setKhataSplitEnabled] = useState(false);
  const [khataPaidNow, setKhataPaidNow] = useState('');
  const [khataPaidVia, setKhataPaidVia] = useState('CASH'); // CASH | UPI
  const [quickSettleTarget, setQuickSettleTarget] = useState(null);
  const [quickSettleAmt, setQuickSettleAmt] = useState('');
  const [quickSettleMode, setQuickSettleMode] = useState('CASH');
  const [isSettlingKhata, setIsSettlingKhata] = useState(false);

  // --- QUICK CUSTOM / LOOSE ITEM STATE ---
  const [customName, setCustomName] = useState('');
  const [customQnty, setCustomQnty] = useState('1 kg');
  const [customPrice, setCustomPrice] = useState('');
  const [customQty, setCustomQty] = useState(1);
  const [customRatePerKg, setCustomRatePerKg] = useState('');

  // --- HARDWARE & MODAL CONTROLS ---
  const [scannerListening, setScannerListening] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastScannedCode, setLastScannedCode] = useState('');
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showFullscreenUpi, setShowFullscreenUpi] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastCompletedBill, setLastCompletedBill] = useState(null);
  const [printingOrder, setPrintingOrder] = useState(null);

  // --- RECENT BILLS SEARCH & FILTER ---
  const [recentBillsSearch, setRecentBillsSearch] = useState('');
  const [recentBillsFilter, setRecentBillsFilter] = useState('ALL'); // ALL | CASH | UPI | KHATA | CONVERTED
  const [recentBillsLimit, setRecentBillsLimit] = useState(15);

  const searchInputRef = useRef(null);
  const customPriceInputRef = useRef(null);
  const scanBufferRef = useRef({ chars: '', lastTime: 0 });

  // Crisp Web Audio POS Beep
  const playPosBeep = (success = true) => {
    if (!soundEnabled) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = success ? 'sine' : 'sawtooth';
      osc.frequency.setValueAtTime(success ? 1200 : 340, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + (success ? 0.09 : 0.2));
    } catch {
      /* ignore audio errors */
    }
  };

  // --- INDEXED SHOP INVENTORY ---
  const validInventory = useMemo(() => {
    return (shopData?.inventory || []).filter(item => item && item.product);
  }, [shopData?.inventory]);

  // Extract unique categories for quick-filter tabs
  const availableCategories = useMemo(() => {
    const set = new Set();
    for (const inv of validInventory) {
      if (inv.product?.category) set.add(inv.product.category.trim());
    }
    return ['ALL', ...Array.from(set).sort()];
  }, [validInventory]);

  // --- SEARCH & CATEGORY FILTERED RESULTS ---
  const searchResults = useMemo(() => {
    let pool = validInventory;
    if (selectedCategory !== 'ALL') {
      pool = pool.filter(i => (i.product?.category || '').trim() === selectedCategory);
    }
    const q = searchQuery.trim().toLowerCase();
    if (!q) return pool.slice(0, 16);
    const tokens = q.split(/\s+/).filter(Boolean);
    const matches = [];
    for (const inv of pool) {
      const p = inv.product;
      const tagsStr = Array.isArray(p.searchTags) ? p.searchTags.join(' ') : (p.searchTags || '');
      const hay = `${p.name || ''} ${p.brand || ''} ${p.category || ''} ${p.barcode || ''} ${tagsStr}`.toLowerCase();
      if (tokens.every(t => hay.includes(t))) {
        matches.push(inv);
        if (matches.length >= 28) break;
      }
    }
    return matches;
  }, [validInventory, selectedCategory, searchQuery]);

  // --- ADD ITEM TO BILL ---
  const addInventoryItemToBill = (invItem, stepQty = 1) => {
    if (!invItem?.product) return;
    const p = invItem.product;
    const pid = String(p._id);
    const unitPrice = Number(invItem.sellingPrice || p.mrp || 0);
    const unitMrp = Math.max(unitPrice, Number(p.mrp || unitPrice));

    setBillItems(prev => {
      const exists = prev.find(i => i.productId === pid && !i.isCustomItem);
      if (exists) {
        return prev.map(i =>
          i.productId === pid && !i.isCustomItem
            ? { ...i, qty: Math.round((Number(i.qty || 1) + stepQty) * 1000) / 1000 }
            : i
        );
      }
      return [
        ...prev,
        {
          rowId: `${pid}_${Date.now()}`,
          productId: pid,
          isCustomItem: false,
          name: p.name,
          brand: p.brand || '',
          qnty: p.qnty || '',
          image: p.image || '',
          emoji: p.emoji || '🛒',
          mrp: unitMrp,
          price: unitPrice,
          qty: stepQty,
        },
      ];
    });
  };

  const addCustomItemToBill = (e) => {
    if (e) e.preventDefault();
    const priceNum = Number(customPrice);
    if (!customName.trim()) {
      toast('Enter an item name or pick a preset', 'error');
      return;
    }
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      toast('Enter a valid price (₹)', 'error');
      return;
    }
    const rawQty = Number(customQty);
    const qtyNum = Number.isFinite(rawQty) && rawQty > 0 ? Math.round(rawQty * 1000) / 1000 : 1;
    const rowId = `pos_custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    setBillItems(prev => [
      ...prev,
      {
        rowId,
        productId: rowId,
        isCustomItem: true,
        name: customName.trim(),
        brand: 'Counter Kirana',
        qnty: customQnty.trim() || '1 unit',
        image: '',
        emoji: '🛍️',
        mrp: priceNum,
        price: priceNum,
        qty: qtyNum,
      },
    ]);

    setCustomName('');
    setCustomPrice('');
    setCustomQty(1);
    setCustomQnty('1 kg');
    setCustomRatePerKg('');
    playPosBeep(true);
  };

  // --- BARCODE SCANNER LOGIC ---
  const handleBarcodeLookup = (rawCode) => {
    const clean = String(rawCode || '').trim();
    if (!clean) return;
    setLastScannedCode(clean);

    // 1. Search Shop Inventory
    const inShop = validInventory.find(
      inv => String(inv.product?.barcode || '').trim().toLowerCase() === clean.toLowerCase()
    );
    if (inShop) {
      playPosBeep(true);
      addInventoryItemToBill(inShop);
      toast(`⚡ Added: ${inShop.product.name} (₹${inShop.sellingPrice || inShop.product.mrp})`);
      return;
    }

    // 2. Search Master Catalog
    const inMaster = (masterCatalog || []).find(
      p => String(p?.barcode || '').trim().toLowerCase() === clean.toLowerCase()
    );
    if (inMaster) {
      playPosBeep(true);
      const pid = String(inMaster._id);
      const unitMrp = Number(inMaster.mrp || 0);
      setBillItems(prev => {
        const exists = prev.find(i => i.productId === pid);
        if (exists) {
          return prev.map(i => (i.productId === pid ? { ...i, qty: i.qty + 1 } : i));
        }
        return [
          ...prev,
          {
            rowId: `${pid}_${Date.now()}`,
            productId: pid,
            isCustomItem: false,
            name: inMaster.name,
            brand: inMaster.brand || '',
            qnty: inMaster.qnty || '',
            image: inMaster.image || '',
            emoji: inMaster.emoji || '🛒',
            mrp: unitMrp,
            price: unitMrp,
            qty: 1,
          },
        ];
      });
      toast(`📦 Catalog Item Added: ${inMaster.name} (MRP ₹${unitMrp})`);
      return;
    }

    // 3. Unrecognized Barcode -> focus custom item
    playPosBeep(false);
    setCustomName(`Scanned Item (${clean})`);
    toast(`🆕 Unlinked Barcode ${clean} — Enter price to add to bill!`, 'info');
    setTimeout(() => customPriceInputRef.current?.focus(), 60);
  };

  // --- KEYBOARD SHORTCUTS & HARDWARE BARCODE GUN LISTENER ---
  useEffect(() => {
    if (!posEnabled) return;

    const onKeyDown = (e) => {
      // F2: Focus Search / Barcode input
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      // F4: Cycle Payment Method
      if (e.key === 'F4') {
        e.preventDefault();
        setPaymentMethod(prev => {
          if (prev === 'CASH') return 'UPI';
          if (prev === 'UPI') return 'KHATA';
          return 'CASH';
        });
        playPosBeep(true);
        return;
      }

      // Ctrl + Enter or F8: Complete Bill
      if ((e.ctrlKey && e.key === 'Enter') || e.key === 'F8') {
        e.preventDefault();
        if (e.shiftKey) {
          handleCompleteBill({ sendWhatsApp: true });
        } else {
          handleCompleteBill({ sendWhatsApp: false });
        }
        return;
      }

      // Escape: Close modals or clear search
      if (e.key === 'Escape') {
        if (quickSettleTarget) {
          setQuickSettleTarget(null);
          return;
        }
        if (printingOrder) {
          setPrintingOrder(null);
          return;
        }
        if (showFullscreenUpi) {
          setShowFullscreenUpi(false);
          return;
        }
        if (showShortcutsModal) {
          setShowShortcutsModal(false);
          return;
        }
        if (searchQuery) {
          setSearchQuery('');
          return;
        }
      }

      // Hardware Barcode Gun stream buffer
      if (!scannerListening) return;
      const tag = (e.target?.tagName || '').toUpperCase();
      const isTypingInInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
      if (isTypingInInput) return;

      const now = Date.now();
      const gap = now - scanBufferRef.current.lastTime;

      if (e.key === 'Enter') {
        if (scanBufferRef.current.chars.length >= 4 && gap < 160) {
          e.preventDefault();
          const code = scanBufferRef.current.chars;
          scanBufferRef.current.chars = '';
          handleBarcodeLookup(code);
        } else {
          scanBufferRef.current.chars = '';
        }
        return;
      }

      if (e.key && e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        if (gap > 130) {
          scanBufferRef.current.chars = e.key;
        } else {
          scanBufferRef.current.chars += e.key;
        }
        scanBufferRef.current.lastTime = now;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posEnabled, scannerListening, validInventory, masterCatalog, printingOrder, showFullscreenUpi, showShortcutsModal, searchQuery]);

  const refreshCustomerLookup = async (cleanPhone) => {
    if (!/^[6-9]\d{9}$/.test(cleanPhone) || !posEnabled || !shopData?._id) return;
    setIsLookingUpCustomer(true);
    try {
      const res = await shopFetch(shopData, `/shops/${shopData._id}/pos-customer/${cleanPhone}`);
      if (res.ok) {
        const data = await res.json();
        setCustomerLookup(data);
        const autoName = data.user?.name || data.khata?.customerName || '';
        if (autoName && !customerName.trim()) {
          setCustomerName(autoName);
        }
      }
    } catch {
      /* ignore */
    }
    setIsLookingUpCustomer(false);
  };

  // --- AUTOMATIC CRM LOOKUP ON 10-DIGIT PHONE ---
  useEffect(() => {
    const clean = customerPhone.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(clean) || !posEnabled) {
      setCustomerLookup(null);
      setRedeemCoins(false);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsLookingUpCustomer(true);
      try {
        const res = await shopFetch(shopData, `/shops/${shopData._id}/pos-customer/${clean}`);
        if (res.ok && !cancelled) {
          const data = await res.json();
          setCustomerLookup(data);
          const autoName = data.user?.name || data.khata?.customerName || '';
          if (autoName && !customerName.trim()) {
            setCustomerName(autoName);
          }
        }
      } catch {
        /* ignore */
      }
      if (!cancelled) setIsLookingUpCustomer(false);
    }, 220);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerPhone, posEnabled, shopData?._id]);

  // --- TOTALS & LOYALTY CALCULATION ---
  const totals = useMemo(() => {
    let mrpTotal = 0;
    let subtotal = 0;
    let totalUnits = 0;

    for (const item of billItems) {
      const qty = Math.max(0.001, Number(item.qty) || 1);
      const price = Math.max(0, Number(item.price) || 0);
      const mrp = Math.max(price, Number(item.mrp) || price);
      mrpTotal += Math.round(mrp * qty * 100) / 100;
      subtotal += Math.round(price * qty * 100) / 100;
      totalUnits += qty;
    }

    const manualDisc = Math.max(0, Math.min(subtotal, Number(discountAmount) || 0));
    const afterManual = Math.max(0, subtotal - manualDisc);

    let coinDiscount = 0;
    let coinsToUse = 0;
    const availableCoins = Number(customerLookup?.user?.coins || 0);
    if (redeemCoins && availableCoins > 0) {
      const maxDiscountAllowed = afterManual * 0.10;
      const maxCoinsConsumable = Math.floor(maxDiscountAllowed * 10);
      coinsToUse = Math.min(availableCoins, maxCoinsConsumable);
      coinDiscount = coinsToUse / 10;
    }

    const finalTotal = Math.max(0, Math.round((afterManual - coinDiscount) * 100) / 100);
    const totalSavings = Math.max(0, Math.round((mrpTotal - finalTotal) * 100) / 100);
    const baseEarned = finalTotal >= 20 ? Math.max(2, Math.floor(finalTotal / 20)) : 1;
    const isNewWalkin = customerPhone.replace(/\D/g, '').length === 10 && customerLookup && !customerLookup.found;
    const estimatedCoinsEarned = customerPhone.replace(/\D/g, '').length === 10
      ? baseEarned + (isNewWalkin ? 10 : 0)
      : 0;

    return {
      mrpTotal: Math.round(mrpTotal * 100) / 100,
      subtotal: Math.round(subtotal * 100) / 100,
      manualDisc: Math.round(manualDisc * 100) / 100,
      coinDiscount: Math.round(coinDiscount * 100) / 100,
      coinsToUse,
      finalTotal,
      totalSavings,
      totalUnits: Math.round(totalUnits * 1000) / 1000,
      estimatedCoinsEarned,
      isNewWalkin,
    };
  }, [billItems, discountAmount, redeemCoins, customerLookup, customerPhone]);

  // Cash change due calculation
  const cashCalculation = useMemo(() => {
    const given = Number(cashTendered) || 0;
    const changeDue = Math.max(0, Math.round((given - totals.finalTotal) * 100) / 100);
    const balanceRemaining = Math.max(0, Math.round((totals.finalTotal - given) * 100) / 100);
    return {
      given,
      changeDue,
      balanceRemaining,
      isExactOrMore: given >= totals.finalTotal,
    };
  }, [cashTendered, totals.finalTotal]);

  // Live Khata ledger impact & split payment preview
  const khataPreview = useMemo(() => {
    const billTotal = totals.finalTotal;
    const rawPaid = khataSplitEnabled ? Math.max(0, Number(khataPaidNow) || 0) : 0;
    const paidNowNum = Math.min(billTotal, Math.round(rawPaid * 100) / 100);
    const addedToKhata = Math.max(0, Math.round((billTotal - paidNowNum) * 100) / 100);
    const prevBalance = Number(customerLookup?.khata?.currentBalance || 0);
    const newTotalKhataPayable = Math.round((prevBalance + addedToKhata) * 100) / 100;
    const hasAccount = Boolean(customerLookup?.khata?.hasAccount);
    const isFirstTimeKhata = !hasAccount;
    const creditLimit = Number(customerLookup?.khata?.creditLimit || 0);
    const willExceedLimit = creditLimit > 0 && newTotalKhataPayable > creditLimit;
    const isOverLimitNow = creditLimit > 0 && prevBalance >= creditLimit;
    return {
      paidNowNum,
      addedToKhata,
      prevBalance,
      newTotalKhataPayable,
      hasAccount,
      isFirstTimeKhata,
      creditLimit,
      willExceedLimit,
      isOverLimitNow,
    };
  }, [totals.finalTotal, khataSplitEnabled, khataPaidNow, customerLookup]);

  // --- TODAY'S STATS ---
  const posOrders = useMemo(() => {
    return (orders || []).filter(o => o && o.orderSource === 'POS');
  }, [orders]);

  const todayStats = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    let collectedTotal = 0;
    let totalBilledToday = 0;
    let count = 0;
    let cashTotal = 0;
    let upiTotal = 0;
    let khataGivenToday = 0;
    let khataBillsCount = 0;
    let convertedCount = 0;

    for (const o of posOrders) {
      const dt = new Date(o.createdAt);
      if (dt >= startOfToday && !/cancel|reject/i.test(o.status || '')) {
        const amt = Number(o.totalAmount) || 0;
        totalBilledToday += amt;
        count += 1;

        if (o.paymentMethod === 'UPI') {
          upiTotal += amt;
          collectedTotal += amt;
        } else if (o.paymentMethod === 'CASH') {
          cashTotal += amt;
          collectedTotal += amt;
        } else if (o.paymentMethod === 'KHATA') {
          const splitPaid = Math.max(0, Number(o.paidAmount) || 0);
          const khataAmt = o.khataAmount != null
            ? Math.max(0, Number(o.khataAmount) || 0)
            : Math.max(0, amt - splitPaid);
          khataGivenToday += khataAmt;
          khataBillsCount += 1;
          if (splitPaid > 0) {
            collectedTotal += splitPaid;
            if (o.paidVia === 'UPI') upiTotal += splitPaid;
            else cashTotal += splitPaid;
          }
        }
        if (o.convertedToOnlineUser) convertedCount += 1;
      }
    }

    return {
      collectedTotal: Math.round(collectedTotal),
      totalBilledToday: Math.round(totalBilledToday),
      count,
      cashTotal: Math.round(cashTotal),
      upiTotal: Math.round(upiTotal),
      khataGivenToday: Math.round(khataGivenToday),
      khataBillsCount,
      convertedCount,
    };
  }, [posOrders]);

  // --- FILTERED RECENT BILLS ---
  const filteredRecentBills = useMemo(() => {
    let list = [...posOrders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (recentBillsFilter !== 'ALL') {
      if (recentBillsFilter === 'CONVERTED') {
        list = list.filter(o => o.convertedToOnlineUser);
      } else {
        list = list.filter(o => o.paymentMethod === recentBillsFilter);
      }
    }

    const q = recentBillsSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(o => {
        const sid = String(o._id || '').slice(-5).toLowerCase();
        const fullId = String(o._id || '').toLowerCase();
        const cname = String(o.customerName || o.userId?.name || '').toLowerCase();
        const cphone = String(o.customerPhone || o.userId?.phone || '').toLowerCase();
        const hasItem = Array.isArray(o.items) && o.items.some(it => String(it?.name || '').toLowerCase().includes(q));
        return sid.includes(q) || fullId.includes(q) || cname.includes(q) || cphone.includes(q) || hasItem;
      });
    }

    return list;
  }, [posOrders, recentBillsFilter, recentBillsSearch]);

  // --- SUBMIT COUNTER BILL ---
  const handleCompleteBill = async ({ sendWhatsApp = false } = {}) => {
    if (billItems.length === 0) {
      toast('Add at least 1 item to the counter bill first!', 'error');
      playPosBeep(false);
      return;
    }

    const cleanPhone = customerPhone.replace(/\D/g, '').slice(-10);
    const isValidPhone = /^[6-9]\d{9}$/.test(cleanPhone);

    if (sendWhatsApp && !isValidPhone) {
      toast('Enter a valid 10-digit customer WhatsApp number to send the bill + store link!', 'error');
      playPosBeep(false);
      return;
    }

    if (paymentMethod === 'KHATA') {
      if (!isValidPhone) {
        toast('Enter customer 10-digit mobile number to record Khata Due!', 'error');
        playPosBeep(false);
        return;
      }
      const effectiveName = customerName.trim() || customerLookup?.user?.name || customerLookup?.khata?.customerName || '';
      if (!effectiveName) {
        toast('Enter customer Name to open/record Khata ledger!', 'error');
        playPosBeep(false);
        return;
      }
      if (khataSplitEnabled && khataPreview.paidNowNum >= totals.finalTotal && totals.finalTotal > 0) {
        toast('Paid Now equals full bill — choose Cash or UPI instead of Khata!', 'error');
        playPosBeep(false);
        return;
      }
    }

    // Defeat popup blockers: synchronously open target tab during user click before async API roundtrip
    let waWindow = null;
    if (sendWhatsApp && isValidPhone) {
      try {
        waWindow = window.open('about:blank', '_blank');
      } catch { }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        items: billItems,
        discountAmount: Number(discountAmount) || 0,
        paymentMethod,
        customerPhone: isValidPhone ? cleanPhone : '',
        customerName: customerName.trim(),
        redeemCoins,
        ...(paymentMethod === 'KHATA'
          ? {
            paidNowAmount: khataSplitEnabled ? khataPreview.paidNowNum : 0,
            paidNowVia: khataPaidVia,
          }
          : {}),
      };

      const res = await shopFetch(shopData, `/shops/${shopData._id}/pos-bills`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (waWindow && !waWindow.closed) {
          try { waWindow.close(); } catch { }
        }
        toast(data.error || 'Failed to create counter bill', 'error');
        playPosBeep(false);
        setIsSubmitting(false);
        return;
      }

      playPosBeep(true);
      const createdOrder = data.order;
      setLastCompletedBill({
        order: createdOrder,
        convertedToOnlineUser: data.convertedToOnlineUser,
        coinsEarned: data.coinsEarned,
        customer: data.customer,
        khataAccount: data.khataAccount,
      });

      // Reset live counter
      setBillItems([]);
      setDiscountAmount('');
      setCashTendered('');
      setCustomerPhone('');
      setCustomerName('');
      setCustomerLookup(null);
      setRedeemCoins(false);
      setKhataSplitEnabled(false);
      setKhataPaidNow('');
      setKhataPaidVia('CASH');

      if (onBillCreated) {
        onBillCreated(data.shop, createdOrder);
      }
      if (onKhataChanged && (paymentMethod === 'KHATA' || data.khataAccount)) {
        onKhataChanged(data.khataAccount);
      }

      const meta = extractKhataMeta(createdOrder);
      if (meta.scenario === 'FIRST_KHATA') {
        toast(`🆕 First Khata Opened & ₹${meta.addedToKhata} Recorded!`);
      } else if (meta.scenario === 'REPEAT_KHATA' && meta.paidNow > 0) {
        toast(`⚖️ Split Bill Saved: ₹${meta.paidNow} Paid + ₹${meta.addedToKhata} Khata!`);
      } else if (meta.scenario === 'REPEAT_KHATA') {
        toast(`📒 +₹${meta.addedToKhata} Added to Khata (Total Due: ₹${meta.netKhataPayable})`);
      } else if (data.convertedToOnlineUser) {
        toast(`🎉 Walk-in Customer Converted to Online Store (+${data.coinsEarned} Coins)!`);
      } else {
        toast(`✅ Counter Bill #${String(createdOrder._id).slice(-5).toUpperCase()} Completed!`);
      }

      if (sendWhatsApp && cleanPhone) {
        sendBillToCustomerWhatsApp(
          { ...createdOrder, customerPhone: createdOrder.customerPhone || cleanPhone },
          shopData,
          { toast, targetWindow: waWindow }
        );
      }
    } catch {
      if (waWindow && !waWindow.closed) {
        try { waWindow.close(); } catch { }
      }
      toast('Network error while saving counter bill', 'error');
      playPosBeep(false);
    }
    setIsSubmitting(false);
  };

  // --- INLINE QUICK SETTLE KHATA AT COUNTER ---
  const handleQuickSettleSubmit = async (e) => {
    e.preventDefault();
    if (!quickSettleTarget) return;
    const amt = Math.round((Number(quickSettleAmt) || 0) * 100) / 100;
    if (amt <= 0) {
      toast('Enter valid collection amount (> ₹0)', 'error');
      playPosBeep(false);
      return;
    }
    if (amt > quickSettleTarget.currentBalance) {
      toast(`Amount cannot exceed pending Khata balance ₹${quickSettleTarget.currentBalance}`, 'error');
      playPosBeep(false);
      return;
    }
    setIsSettlingKhata(true);
    try {
      const res = await shopFetch(shopData, `/shops/${shopData._id}/khata/record-payment`, {
        method: 'POST',
        body: JSON.stringify({
          accountId: quickSettleTarget.accountId,
          phone: quickSettleTarget.customerPhone,
          amount: amt,
          mode: quickSettleMode,
          note: 'Quick settled at Counter POS',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(data.error || 'Could not record Khata payment', 'error');
        playPosBeep(false);
        setIsSettlingKhata(false);
        return;
      }
      playPosBeep(true);
      toast(`✅ ₹${amt} Khata Jama Recorded! Remaining Due: ₹${data.account?.currentBalance ?? 0}`);
      const settledPhone = quickSettleTarget.customerPhone;
      setQuickSettleTarget(null);
      setQuickSettleAmt('');
      if (onKhataChanged) onKhataChanged(data.account);
      if (settledPhone && customerPhone.replace(/\D/g, '').slice(-10) === settledPhone) {
        refreshCustomerLookup(settledPhone);
      }
    } catch {
      toast('Network error while recording Khata payment', 'error');
      playPosBeep(false);
    }
    setIsSettlingKhata(false);
  };

  // --- ADMIN GATE SCREEN IF NOT ENABLED ---
  if (!posEnabled) {
    return (
      <div style={{ background: '#ffffff', borderRadius: '20px', padding: '40px 24px', textAlign: 'center', boxShadow: '0 8px 30px rgba(15,23,42,0.06)', border: '2px dashed #cbd5e1', marginTop: '15px' }}>
        <div style={{ fontSize: '3.6rem', marginBottom: '14px' }}>⚡🧾</div>
        <h2 style={{ margin: '0 0 10px', color: '#0f172a', fontSize: '1.45rem', fontWeight: 900 }}>
          Supercharged Counter POS & Walk-in Billing
        </h2>
        <p style={{ color: '#475569', maxWidth: '540px', margin: '0 auto 20px', lineHeight: 1.6, fontSize: '0.94rem' }}>
          Bill walk-in customers in 5 seconds with a Barcode Scanner or quick loose item buttons, display dynamic scan-to-pay UPI QR codes, print crisp thermal receipts, and turn walk-in shoppers into repeat online buyers via WhatsApp!
        </p>
        <div style={{ display: 'inline-block', background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', padding: '12px 20px', borderRadius: '12px', fontWeight: 800, fontSize: '0.88rem' }}>
          🔒 This feature is enabled by PackItOut Admin. Contact support to activate Counter POS for your shop!
        </div>
      </div>
    );
  }

  // Dynamic UPI Intent URI and QR image (supports full UPI OR Split Khata upfront UPI)
  const hasShopUpi = Boolean(shopData?.upiId && String(shopData.upiId).includes('@'));
  const activeUpiAmount = paymentMethod === 'UPI'
    ? totals.finalTotal
    : (paymentMethod === 'KHATA' && khataSplitEnabled && khataPaidVia === 'UPI' ? khataPreview.paidNowNum : 0);
  const upiIntentUri = hasShopUpi && activeUpiAmount > 0
    ? `upi://pay?pa=${encodeURIComponent(shopData.upiId)}&pn=${encodeURIComponent(shopData.name || 'Store')}&am=${activeUpiAmount}&cu=INR&tn=${encodeURIComponent(`Store Bill #${Date.now().toString().slice(-4)}`)}`
    : '';
  const upiQrImageUrl = upiIntentUri
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(upiIntentUri)}`
    : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* 📊 1. TODAY'S REGISTER METRICS & HARDWARE CONTROLS */}
      <div style={{
        background: 'linear-gradient(135deg, #090d16 0%, #1e293b 100%)',
        color: '#fff',
        padding: '16px 20px',
        borderRadius: '18px',
        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.22)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(165px, 1fr))',
        gap: '14px',
        alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            ⚡ Collected Today
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#34d399', marginTop: '2px', letterSpacing: '-0.5px' }}>
            ₹{todayStats.collectedTotal}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
            {todayStats.count} Bill{todayStats.count !== 1 ? 's' : ''} • Billed ₹{todayStats.totalBilledToday}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            💵 Cash vs 📱 UPI
          </div>
          <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>
            Cash: <strong style={{ color: '#86efac' }}>₹{todayStats.cashTotal}</strong>
          </div>
          <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#38bdf8' }}>
            UPI: <strong style={{ color: '#7dd3fc' }}>₹{todayStats.upiTotal}</strong>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            📒 Khata & Udhaar
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 900, color: '#fbbf24', marginTop: '3px' }}>
            Today: +₹{todayStats.khataGivenToday}
            <span style={{ fontSize: '0.72rem', color: '#cbd5e1', fontWeight: 700, marginLeft: '5px' }}>
              ({todayStats.khataBillsCount})
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.72rem', color: '#fde68a', fontWeight: 700 }}>
              Market Due: ₹{Math.round(Number(khataSummary?.totalReceivable || 0))}
            </span>
            {onOpenKhataBook && (
              <button
                type="button"
                onClick={() => onOpenKhataBook('')}
                style={{
                  padding: '2px 7px',
                  borderRadius: '6px',
                  border: '1px solid #f59e0b',
                  background: 'rgba(245, 158, 11, 0.2)',
                  color: '#fde68a',
                  fontSize: '0.68rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                }}
              >
                Ledger ›
              </button>
            )}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            🚀 Offline → Online
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#fbbf24', marginTop: '2px' }}>
            {todayStats.convertedCount} <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#cbd5e1' }}>Converted</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
            Registered on Storefront
          </div>
        </div>

        {/* Hardware Status & Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setScannerListening(v => !v)}
              title="Toggle USB / Bluetooth Barcode Gun Scanner"
              style={{
                padding: '6px 12px',
                borderRadius: '999px',
                border: scannerListening ? '1px solid #34d399' : '1px solid #64748b',
                background: scannerListening ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.08)',
                color: scannerListening ? '#6ee7b7' : '#94a3b8',
                fontWeight: 800,
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              {scannerListening ? '🔫 Gun: ACTIVE' : '🔫 Gun: PAUSED'}
            </button>

            <button
              type="button"
              onClick={() => setSoundEnabled(v => !v)}
              title="Toggle POS Beep Audio"
              style={{
                padding: '6px 10px',
                borderRadius: '999px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: soundEnabled ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              {soundEnabled ? '🔊 Sound' : '🔇 Mute'}
            </button>

            <button
              type="button"
              onClick={() => setShowShortcutsModal(true)}
              title="Keyboard Shortcuts Cheat Sheet"
              style={{
                padding: '6px 10px',
                borderRadius: '999px',
                border: '1px solid #38bdf8',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#7dd3fc',
                fontWeight: 800,
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              ⌨️ Shortcuts
            </button>
          </div>

          {lastScannedCode && (
            <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontFamily: 'monospace' }}>
              Scanned: <strong>{lastScannedCode}</strong>
            </div>
          )}
        </div>
      </div>

      {/* 🎉 POST-CHECKOUT SUCCESS NOTIFICATION BANNER */}
      {lastCompletedBill && (() => {
        const meta = extractKhataMeta(lastCompletedBill.order);
        const custPhone = lastCompletedBill.order.customerPhone || lastCompletedBill.order.userId?.phone || '';
        const isKhata = meta.scenario === 'FIRST_KHATA' || meta.scenario === 'REPEAT_KHATA';
        return (
          <div style={{
            background: isKhata
              ? 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)'
              : 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
            border: isKhata ? '2px solid #f59e0b' : '2px solid #10b981',
            borderRadius: '16px',
            padding: '14px 18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            boxShadow: isKhata ? '0 4px 16px rgba(245, 158, 11, 0.16)' : '0 4px 16px rgba(16, 185, 129, 0.15)',
          }}>
            <div>
              <div style={{ fontWeight: 900, color: isKhata ? '#92400e' : '#065f46', fontSize: '0.98rem', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span>✅ Bill #{String(lastCompletedBill.order._id).slice(-5).toUpperCase()} Saved • ₹{lastCompletedBill.order.totalAmount} ({lastCompletedBill.order.paymentMethod})</span>
                {meta.scenario === 'FIRST_KHATA' && (
                  <span style={{ background: '#7c3aed', color: '#fff', padding: '2px 8px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 900 }}>
                    🆕 FIRST KHATA ACCOUNT OPENED
                  </span>
                )}
                {meta.scenario === 'REPEAT_KHATA' && (
                  <span style={{ background: '#d97706', color: '#fff', padding: '2px 8px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 900 }}>
                    📒 +₹{meta.addedToKhata} • Total Khata Due: ₹{meta.netKhataPayable}
                  </span>
                )}
                {meta.scenario === 'PAID_WITH_OLD_KHATA' && (
                  <span style={{ background: '#b45309', color: '#fff', padding: '2px 8px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 800 }}>
                    ℹ️ Paid Today • Prior Khata Due: ₹{meta.previousBalance}
                  </span>
                )}
                {lastCompletedBill.convertedToOnlineUser && (
                  <span style={{ background: '#059669', color: '#fff', padding: '2px 8px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 800 }}>
                    🚀 Online Customer Created!
                  </span>
                )}
              </div>
              {isKhata && meta.paidNow > 0 && (
                <div style={{ fontSize: '0.78rem', color: '#78350f', fontWeight: 800, marginTop: '3px' }}>
                  ⚖️ Split Settlement: ₹{meta.paidNow} Paid ({meta.paidVia}) • ₹{meta.addedToKhata} Added to Khata • Net Khata Payable: ₹{meta.netKhataPayable}
                </div>
              )}
              <div style={{ fontSize: '0.78rem', color: isKhata ? '#b45309' : '#047857', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span>
                  Digital Web Bill:{' '}
                  <a
                    href={getPublicBillUrl(lastCompletedBill.order._id, shopData._id, shopData.pincode)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: isKhata ? '#92400e' : '#047857', fontWeight: 800, textDecoration: 'underline' }}
                  >
                    {getPublicBillUrl(lastCompletedBill.order._id, shopData._id, shopData.pincode)}
                  </a>
                </span>
                {(isKhata || meta.scenario === 'PAID_WITH_OLD_KHATA') && onOpenKhataBook && custPhone && (
                  <button
                    type="button"
                    onClick={() => onOpenKhataBook(custPhone)}
                    style={{ background: '#fff', border: '1px solid #d97706', color: '#92400e', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 900, cursor: 'pointer' }}
                  >
                    📒 View Customer Khata ›
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  sendBillToCustomerWhatsApp(
                    {
                      ...lastCompletedBill.order,
                      customerPhone:
                        lastCompletedBill.order.customerPhone ||
                        lastCompletedBill.order.userId?.phone ||
                        lastCompletedBill.customer?.phone ||
                        '',
                    },
                    shopData,
                    { toast }
                  );
                }}
                style={{
                  padding: '8px 14px',
                  background: '#16a34a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)',
                }}
              >
                📲 Send PDF Bill on WhatsApp
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    toast('Generating PDF bill…', 'info');
                    await downloadReceiptPdf(lastCompletedBill.order, shopData);
                    toast('📄 PDF Bill Downloaded!', 'success');
                  } catch {
                    toast('Could not generate PDF bill', 'error');
                  }
                }}
                style={{
                  padding: '8px 12px',
                  background: '#eff6ff',
                  color: '#1d4ed8',
                  border: '1px solid #93c5fd',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                📄 Download PDF
              </button>
              <button
                type="button"
                onClick={() => setPrintingOrder(lastCompletedBill.order)}
                style={{
                  padding: '8px 14px',
                  background: '#0f172a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                🖨️ Print Receipt
              </button>
              <button
                type="button"
                onClick={() => setLastCompletedBill(null)}
                style={{
                  padding: '8px 12px',
                  background: 'transparent',
                  color: isKhata ? '#92400e' : '#065f46',
                  border: `1px solid ${isKhata ? '#fcd34d' : '#6ee7b7'}`,
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                ✕ Dismiss
              </button>
            </div>
          </div>
        );
      })()}

      {/* ⚡ 2. MAIN POS WORKSPACE: 2-COLUMN SPLIT */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))',
        gap: '16px',
        alignItems: 'start',
      }}>

        {/* ================= LEFT PANE: PRODUCT SEARCH & LOOSE KIRANA ================= */}
        <div style={{ background: '#ffffff', borderRadius: '18px', padding: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>

          {/* Search Header & F2 indicator */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '6px' }}>
              🔍 1. Scan Barcode or Search Item
            </h3>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>
              Press <kbd style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: 900 }}>F2</kbd>
            </span>
          </div>

          {/* Barcode / Search Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const q = searchQuery.trim();
              if (!q) return;
              if (/^\d{6,14}$/.test(q)) {
                handleBarcodeLookup(q);
                setSearchQuery('');
                return;
              }
              if (searchResults.length > 0) {
                addInventoryItemToBill(searchResults[0]);
                playPosBeep(true);
                toast(`⚡ Added: ${searchResults[0].product.name}`);
                setSearchQuery('');
              }
            }}
            style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}
          >
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Type name, brand, or scan barcode (Press Enter to add)…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                padding: '11px 14px',
                borderRadius: '12px',
                border: '2px solid #cbd5e1',
                fontSize: '0.92rem',
                fontWeight: 600,
                outline: 'none',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.03)',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ padding: '0 12px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontWeight: 800 }}
              >
                ✕
              </button>
            )}
          </form>

          {/* Category Filter Pills */}
          {availableCategories.length > 2 && (
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '6px', marginBottom: '10px' }}>
              {availableCategories.map(cat => {
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '999px',
                      border: active ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                      background: active ? '#eff6ff' : '#ffffff',
                      color: active ? '#1d4ed8' : '#475569',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {cat === 'ALL' ? '📦 All Items' : cat}
                  </button>
                );
              })}
            </div>
          )}

          {/* Fast Tap Product Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))',
            gap: '8px',
            maxHeight: '280px',
            overflowY: 'auto',
            paddingRight: '4px',
            marginBottom: '14px',
          }}>
            {searchResults.map((inv) => {
              const p = inv.product;
              const price = Number(inv.sellingPrice || p.mrp || 0);
              const mrp = Number(p.mrp || price);
              const inBill = billItems.find(b => b.productId === String(p._id) && !b.isCustomItem);
              return (
                <button
                  key={p._id}
                  type="button"
                  onClick={() => {
                    addInventoryItemToBill(inv);
                    playPosBeep(true);
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    textAlign: 'left',
                    padding: '9px',
                    borderRadius: '12px',
                    border: inBill ? '2px solid #16a34a' : '1px solid #e2e8f0',
                    background: inBill ? '#f0fdf4' : '#f8fafc',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {inBill && (
                    <span style={{
                      position: 'absolute',
                      top: '5px',
                      right: '5px',
                      background: '#16a34a',
                      color: '#fff',
                      fontSize: '0.68rem',
                      fontWeight: 900,
                      padding: '2px 6px',
                      borderRadius: '999px',
                      boxShadow: '0 2px 4px rgba(22, 163, 74, 0.3)',
                    }}>
                      ×{inBill.qty}
                    </span>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    {p.image ? (
                      <img src={cdnImage(p.image, 60)} alt={p.name} style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <span style={{ fontSize: '1.25rem' }}>{p.emoji || '🛒'}</span>
                    )}
                    <div style={{ fontSize: '0.77rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {p.name}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', fontSize: '0.74rem' }}>
                    <span style={{ color: '#64748b' }}>{p.qnty || '1 unit'}</span>
                    <span style={{ fontWeight: 900, color: '#15803d', fontSize: '0.86rem' }}>
                      ₹{price}
                      {mrp > price && (
                        <span style={{ color: '#94a3b8', textDecoration: 'line-through', fontSize: '0.66rem', marginLeft: '3px' }}>
                          ₹{mrp}
                        </span>
                      )}
                    </span>
                  </div>
                </button>
              );
            })}
            {searchResults.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '0.84rem' }}>
                No items found. Use the Loose Item box below to add any unbarcoded item!
              </div>
            )}
          </div>

          {/* 🌾 LOOSE / UNBARCODED KIRANA ITEM QUICK-ADD */}
          <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: '14px', padding: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 900, color: '#92400e' }}>
                ⚖️ 2. Loose / Unbarcoded Kirana (Sugar, Atta, Veggies, Dal)
              </div>
              <span style={{ fontSize: '0.7rem', color: '#b45309', fontWeight: 700 }}>
                Fractional / Decimals Supported
              </span>
            </div>

            {/* Presets 1-Tap Chips */}
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '10px' }}>
              {LOOSE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setCustomName(preset.name);
                    setCustomQnty(preset.qnty);
                    if (preset.defaultPrice) {
                      setCustomPrice(String(preset.defaultPrice));
                      setCustomRatePerKg(String(preset.defaultPrice));
                    }
                    setTimeout(() => customPriceInputRef.current?.focus(), 40);
                  }}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '8px',
                    border: '1px solid #fcd34d',
                    background: customName === preset.name ? '#f59e0b' : '#ffffff',
                    color: customName === preset.name ? '#ffffff' : '#78350f',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Quick Weight Presets */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.72rem', color: '#78350f', fontWeight: 800 }}>Quick Weight:</span>
              {QUICK_WEIGHTS.map(w => (
                <button
                  key={w.label}
                  type="button"
                  onClick={() => {
                    setCustomQty(w.factor);
                    setCustomQnty(w.tag);
                    if (customRatePerKg) {
                      const rate = Number(customRatePerKg);
                      if (rate > 0) {
                        setCustomPrice(String(Math.round(rate * w.factor * 100) / 100));
                      }
                    }
                  }}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    border: '1px solid #d97706',
                    background: customQty === w.factor ? '#d97706' : '#fff',
                    color: customQty === w.factor ? '#fff' : '#78350f',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {w.label}
                </button>
              ))}
            </div>

            {/* Custom Item Form */}
            <form onSubmit={addCustomItemToBill} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '6px' }}>
              <input
                type="text"
                placeholder="Item name (e.g. Sugar)"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', width: '100%', boxSizing: 'border-box' }}
              />
              <input
                type="text"
                placeholder="Unit/Tag (e.g. 1 kg)"
                value={customQnty}
                onChange={(e) => setCustomQnty(e.target.value)}
                style={{ padding: '8px 8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', width: '100%', boxSizing: 'border-box' }}
              />
              <input
                type="number"
                step="any"
                min="0.01"
                placeholder="Qty/Kg"
                value={customQty}
                onChange={(e) => setCustomQty(e.target.value)}
                title="Quantity or Weight multiplier"
                style={{ padding: '8px 6px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', width: '100%', boxSizing: 'border-box', textAlign: 'center' }}
              />
              <input
                ref={customPriceInputRef}
                type="number"
                min="0"
                step="any"
                placeholder="₹ Price"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                style={{ padding: '8px 8px', borderRadius: '8px', border: '2px solid #f59e0b', fontSize: '0.85rem', fontWeight: 800, width: '100%', boxSizing: 'border-box', textAlign: 'right' }}
              />
              <button
                type="submit"
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#d97706',
                  color: '#fff',
                  fontWeight: 900,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                + Add
              </button>
            </form>
          </div>
        </div>

        {/* ================= RIGHT PANE: LIVE BILL & CHECKOUT ================= */}
        <div style={{ background: '#ffffff', borderRadius: '18px', padding: '16px', border: '2px solid #0f172a', boxShadow: '0 8px 30px rgba(15,23,42,0.08)' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '10px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a', fontWeight: 900 }}>
                🧾 Live Counter Bill ({billItems.length} items • {totals.totalUnits} units)
              </h3>
            </div>
            {billItems.length > 0 && (
              <button
                type="button"
                onClick={() => setBillItems([])}
                style={{ background: '#fee2e2', color: '#b91c1c', border: 'none', padding: '5px 10px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 800, cursor: 'pointer' }}
              >
                🗑️ Clear
              </button>
            )}
          </div>

          {/* Line Items List */}
          {billItems.length === 0 ? (
            <div style={{ padding: '36px 16px', textAlign: 'center', background: '#f8fafc', borderRadius: '14px', border: '1.5px dashed #cbd5e1', color: '#64748b', marginBottom: '14px' }}>
              <div style={{ fontSize: '2.4rem', marginBottom: '6px' }}>🔫🛍️</div>
              <div style={{ fontWeight: 800, color: '#334155', fontSize: '0.94rem' }}>
                Scan a barcode or tap any product to begin billing!
              </div>
              <div style={{ fontSize: '0.76rem', marginTop: '4px' }}>
                Items will appear here instantly with live price calculations.
              </div>
            </div>
          ) : (
            <div style={{ maxHeight: '250px', overflowY: 'auto', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {billItems.map((item, idx) => {
                const qty = Number(item.qty) || 1;
                const price = Number(item.price) || 0;
                const lineTotal = Math.round(price * qty * 100) / 100;
                return (
                  <div
                    key={item.rowId || idx}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.2fr auto auto auto',
                      gap: '8px',
                      alignItems: 'center',
                      padding: '8px 10px',
                      background: '#f8fafc',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: '0.84rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        {item.qnty || '1 unit'} {item.mrp > item.price ? `• MRP ₹${item.mrp}` : ''}
                      </div>
                    </div>

                    {/* Quantity Stepper & Decimal Input */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '2px 4px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setBillItems(prev =>
                            prev
                              .map((it, i) => (i === idx ? { ...it, qty: Math.max(0, Math.round((it.qty - (it.qty <= 1 && it.qty > 0.1 ? 0.25 : 1)) * 100) / 100) } : it))
                              .filter(it => it.qty > 0)
                          );
                        }}
                        style={{ border: 'none', background: 'transparent', fontWeight: 900, cursor: 'pointer', padding: '2px 4px', color: '#dc2626' }}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        step="any"
                        min="0.01"
                        value={item.qty}
                        onChange={(e) => {
                          const val = Math.max(0.01, Number(e.target.value) || 0);
                          setBillItems(prev =>
                            prev.map((it, i) => (i === idx ? { ...it, qty: val } : it))
                          );
                        }}
                        title="Edit quantity"
                        style={{
                          width: '42px',
                          border: 'none',
                          fontWeight: 900,
                          fontSize: '0.82rem',
                          textAlign: 'center',
                          outline: 'none',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setBillItems(prev =>
                            prev.map((it, i) => (i === idx ? { ...it, qty: Math.round((it.qty + 1) * 100) / 100 } : it))
                          );
                        }}
                        style={{ border: 'none', background: 'transparent', fontWeight: 900, cursor: 'pointer', padding: '2px 4px', color: '#16a34a' }}
                      >
                        +
                      </button>
                    </div>

                    {/* Editable Unit Price */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>₹</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.price}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value) || 0);
                          setBillItems(prev =>
                            prev.map((it, i) => (i === idx ? { ...it, price: val } : it))
                          );
                        }}
                        title="Edit unit selling price"
                        style={{
                          width: '54px',
                          padding: '4px 6px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          fontWeight: 800,
                          fontSize: '0.82rem',
                          textAlign: 'right',
                        }}
                      />
                    </div>

                    {/* Line Total & Remove */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '60px', justifyContent: 'flex-end' }}>
                      <span style={{ fontWeight: 900, fontSize: '0.88rem', color: '#0f172a' }}>
                        ₹{lineTotal}
                      </span>
                      <button
                        type="button"
                        onClick={() => setBillItems(prev => prev.filter((_, i) => i !== idx))}
                        style={{ border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontWeight: 800, fontSize: '0.8rem', padding: 0 }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Discount & Round-Off Strip */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px', background: '#f8fafc', padding: '8px 10px', borderRadius: '10px', border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569' }}>🏷️ Extra Disc (₹):</span>
            <input
              type="number"
              min="0"
              step="any"
              placeholder="0"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(e.target.value)}
              style={{ width: '70px', padding: '5px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 800, fontSize: '0.82rem' }}
            />
            {totals.subtotal > 10 && totals.subtotal % 10 !== 0 && (
              <button
                type="button"
                onClick={() => {
                  const remainder = Math.round((totals.subtotal % 10) * 100) / 100;
                  setDiscountAmount(String(remainder));
                }}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: '1px solid #3b82f6',
                  background: '#eff6ff',
                  color: '#1d4ed8',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                🎯 Round Off (-₹{Math.round((totals.subtotal % 10) * 100) / 100})
              </button>
            )}
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 800 }}>
                Total Saved: ₹{totals.totalSavings}
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>
                ₹{totals.finalTotal}
              </div>
            </div>
          </div>

          {/* 🌐 WALK-IN CUSTOMER & CRM PANEL */}
          <div style={{
            background: paymentMethod === 'KHATA'
              ? 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)'
              : 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
            border: paymentMethod === 'KHATA' ? '1.5px solid #f59e0b' : '1.5px solid #60a5fa',
            borderRadius: '12px',
            padding: '10px 12px',
            marginBottom: '10px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 900, color: paymentMethod === 'KHATA' ? '#92400e' : '#1e3a8a' }}>
                {paymentMethod === 'KHATA'
                  ? '📒 Customer Mobile & Name (Required for Khata)'
                  : '📲 Customer Phone (Offline → Online Converter)'}
              </span>
              {isLookingUpCustomer && (
                <span style={{ fontSize: '0.7rem', color: '#2563eb', fontWeight: 700 }}>Checking…</span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '6px' }}>
              <input
                type="tel"
                maxLength={10}
                placeholder={paymentMethod === 'KHATA' ? '📞 10-Digit Phone *' : '📞 10-Digit WhatsApp No.'}
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                style={{
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: paymentMethod === 'KHATA' ? '2px solid #d97706' : '2px solid #3b82f6',
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  background: '#fff',
                }}
              />
              <input
                type="text"
                placeholder={paymentMethod === 'KHATA' ? '👤 Full Name *' : '👤 Name (Optional)'}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                style={{
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: paymentMethod === 'KHATA' ? '1.5px solid #f59e0b' : '1px solid #93c5fd',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  background: '#fff',
                }}
              />
            </div>

            {/* Live Customer Status Badge + Khata Status Strip */}
            {customerLookup && (() => {
              const kh = customerLookup.khata;
              const clean = customerPhone.replace(/\D/g, '').slice(-10);
              return (
                <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ padding: '6px 10px', borderRadius: '8px', background: customerLookup.found ? '#ecfdf5' : '#fef3c7', border: `1px solid ${customerLookup.found ? '#34d399' : '#fcd34d'}`, fontSize: '0.74rem' }}>
                    {customerLookup.found ? (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                        <span style={{ color: '#065f46', fontWeight: 800 }}>
                          ⭐ Returning Customer: <strong>{customerLookup.user.name}</strong> • {customerLookup.pastOrdersCount} visits • 🪙 {customerLookup.user.coins} Coins
                        </span>
                        {customerLookup.user.coins >= 10 && (
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontWeight: 900, color: '#047857', background: '#fff', padding: '2px 6px', borderRadius: '6px', border: '1px solid #10b981' }}>
                            <input
                              type="checkbox"
                              checked={redeemCoins}
                              onChange={(e) => setRedeemCoins(e.target.checked)}
                            />
                            Use Coins (-₹{totals.coinDiscount})
                          </label>
                        )}
                      </div>
                    ) : (
                      <div style={{ color: '#92400e', fontWeight: 800 }}>
                        🚀 <strong>First-Time Walk-in!</strong> Saving will auto-create their Online Account, set <strong>{shopData.name}</strong> as primary & gift <strong>+{totals.estimatedCoinsEarned} Coins</strong>!
                      </div>
                    )}
                  </div>

                  {/* LIVE KHATA ACCOUNT STRIP */}
                  {kh?.hasAccount && kh.currentBalance > 0 && (
                    <div style={{
                      padding: '7px 10px',
                      borderRadius: '8px',
                      background: kh.creditLimit > 0 && kh.currentBalance >= kh.creditLimit ? '#fef2f2' : '#fffbeb',
                      border: `1.5px solid ${kh.creditLimit > 0 && kh.currentBalance >= kh.creditLimit ? '#ef4444' : '#f59e0b'}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '6px',
                      fontSize: '0.74rem',
                    }}>
                      <div>
                        <span style={{ fontWeight: 900, color: kh.creditLimit > 0 && kh.currentBalance >= kh.creditLimit ? '#b91c1c' : '#92400e' }}>
                          📒 Pending Khata Due: ₹{kh.currentBalance}
                        </span>
                        {kh.creditLimit > 0 && kh.currentBalance >= kh.creditLimit && (
                          <span style={{ marginLeft: '6px', background: '#dc2626', color: '#fff', padding: '1px 6px', borderRadius: '4px', fontSize: '0.66rem', fontWeight: 900 }}>
                            ⚠️ OVER LIMIT (₹{kh.creditLimit})
                          </span>
                        )}
                        {kh.pendingVerificationCount > 0 && (
                          <span style={{ marginLeft: '6px', background: '#fef08a', color: '#854d0e', padding: '1px 6px', borderRadius: '4px', fontSize: '0.66rem', fontWeight: 900 }}>
                            ⏳ {kh.pendingVerificationCount} UPI Approval Pending
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setQuickSettleTarget({
                              accountId: kh.accountId,
                              customerName: kh.customerName || customerName.trim() || customerLookup?.user?.name || 'Customer',
                              customerPhone: clean,
                              currentBalance: Number(kh.currentBalance || 0),
                            });
                            setQuickSettleAmt(String(kh.currentBalance || ''));
                            setQuickSettleMode('CASH');
                          }}
                          style={{ padding: '3px 8px', borderRadius: '6px', border: 'none', background: '#16a34a', color: '#fff', fontWeight: 900, fontSize: '0.7rem', cursor: 'pointer' }}
                        >
                          💰 Quick Settle
                        </button>
                        {onOpenKhataBook && (
                          <button
                            type="button"
                            onClick={() => onOpenKhataBook(clean)}
                            style={{ padding: '3px 8px', borderRadius: '6px', border: '1px solid #d97706', background: '#fff', color: '#92400e', fontWeight: 800, fontSize: '0.7rem', cursor: 'pointer' }}
                          >
                            📒 Ledger ›
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {kh?.hasAccount && kh.currentBalance === 0 && (
                    <div style={{ padding: '5px 10px', borderRadius: '8px', background: '#f0fdf4', border: '1px solid #86efac', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem' }}>
                      <span style={{ color: '#166534', fontWeight: 800 }}>
                        📒 Past Khata Customer • ₹0 All Cleared ✅ (Settled: ₹{kh.totalSettled || 0})
                      </span>
                      {onOpenKhataBook && (
                        <button
                          type="button"
                          onClick={() => onOpenKhataBook(clean)}
                          style={{ padding: '2px 7px', borderRadius: '6px', border: '1px solid #16a34a', background: '#fff', color: '#166534', fontWeight: 800, fontSize: '0.68rem', cursor: 'pointer' }}
                        >
                          History ›
                        </button>
                      )}
                    </div>
                  )}

                  {!kh?.hasAccount && paymentMethod === 'KHATA' && (
                    <div style={{ padding: '6px 10px', borderRadius: '8px', background: '#f5f3ff', border: '1px solid #c4b5fd', color: '#5b21b6', fontWeight: 800, fontSize: '0.72rem' }}>
                      🆕 First-Time Khata Customer — Bill &amp; PDF will clearly stamp <strong>&quot;NEW KHATA ACCOUNT OPENED (FIRST ENTRY)&quot;</strong>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* 💳 PAYMENT METHOD & CASH TENDERED CALCULATOR */}
          <div style={{ marginBottom: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
              {[
                { id: 'CASH', label: '💵 Cash', bg: '#ecfdf5', activeBg: '#16a34a', fg: '#065f46' },
                { id: 'UPI', label: '📱 UPI QR', bg: '#eff6ff', activeBg: '#2563eb', fg: '#1e40af' },
                { id: 'KHATA', label: '📒 Khata Due', bg: '#fef3c7', activeBg: '#d97706', fg: '#92400e' },
              ].map((m) => {
                const active = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(m.id);
                      playPosBeep(true);
                    }}
                    style={{
                      padding: '8px 4px',
                      borderRadius: '8px',
                      border: active ? `2px solid ${m.activeBg}` : '1px solid #cbd5e1',
                      background: active ? m.activeBg : m.bg,
                      color: active ? '#ffffff' : m.fg,
                      fontWeight: 900,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                    }}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>

            {/* CASH TENDERED & CHANGE RETURN CALCULATOR */}
            {paymentMethod === 'CASH' && totals.finalTotal > 0 && (
              <div style={{ marginTop: '8px', padding: '10px', borderRadius: '10px', background: '#f0fdf4', border: '1.5px solid #86efac' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 900, color: '#166534' }}>
                    💵 Cash Tendered Calculator
                  </span>
                  {cashCalculation.given > 0 && (
                    <span style={{
                      fontWeight: 900,
                      fontSize: '0.85rem',
                      color: cashCalculation.isExactOrMore ? '#15803d' : '#b91c1c',
                      background: cashCalculation.isExactOrMore ? '#dcfce7' : '#fee2e2',
                      padding: '2px 8px',
                      borderRadius: '6px',
                    }}>
                      {cashCalculation.isExactOrMore
                        ? `Change Return: ₹${cashCalculation.changeDue}`
                        : `Due: ₹${cashCalculation.balanceRemaining}`}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input
                    type="number"
                    min="0"
                    placeholder={`Amount received (e.g. ₹${totals.finalTotal})`}
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1.5px solid #16a34a',
                      fontWeight: 900,
                      fontSize: '0.9rem',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setCashTendered(String(totals.finalTotal))}
                    style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #86efac', background: '#fff', color: '#166534', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    Exact
                  </button>
                  {[50, 100, 200, 500].map(note => (
                    <button
                      key={note}
                      type="button"
                      onClick={() => setCashTendered(String(note))}
                      style={{ padding: '8px 8px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', fontWeight: 800, fontSize: '0.74rem', cursor: 'pointer' }}
                    >
                      ₹{note}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* DYNAMIC UPI QR CODE */}
            {paymentMethod === 'UPI' && totals.finalTotal > 0 && (
              <div style={{ marginTop: '8px', padding: '10px', borderRadius: '12px', background: '#f8fafc', border: '1.5px dashed #3b82f6', display: 'flex', alignItems: 'center', gap: '12px' }}>
                {hasShopUpi ? (
                  <>
                    <img
                      src={upiQrImageUrl}
                      alt="UPI QR Code"
                      style={{ width: '96px', height: '96px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 900, color: '#1e3a8a', fontSize: '0.88rem' }}>
                        📱 Scan to Pay Exact ₹{totals.finalTotal}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#475569', marginTop: '2px', wordBreak: 'break-all' }}>
                        UPI: <strong>{shopData.upiId}</strong>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                        <button
                          type="button"
                          onClick={() => setShowFullscreenUpi(true)}
                          style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #3b82f6', background: '#eff6ff', color: '#1d4ed8', fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer' }}
                        >
                          🔍 Fullscreen QR
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (navigator.clipboard) {
                              navigator.clipboard.writeText(upiIntentUri);
                              toast('UPI Payment Link copied!');
                            }
                          }}
                          style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer' }}
                        >
                          📋 Copy Link
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: '0.78rem', color: '#b45309', fontWeight: 700 }}>
                    ⚠️ Configure your Shop UPI ID in Shop Profile to display a dynamic scan-to-pay QR code here!
                  </div>
                )}
              </div>
            )}

            {/* 📒 KHATA DUE & SPLIT SETTLEMENT PANEL */}
            {paymentMethod === 'KHATA' && (
              <div style={{ marginTop: '8px', padding: '10px 12px', borderRadius: '12px', background: '#fffbeb', border: '1.5px solid #f59e0b' }}>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setKhataSplitEnabled(false);
                      setKhataPaidNow('');
                    }}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      borderRadius: '8px',
                      border: !khataSplitEnabled ? '2px solid #d97706' : '1px solid #fcd34d',
                      background: !khataSplitEnabled ? '#d97706' : '#fff',
                      color: !khataSplitEnabled ? '#fff' : '#92400e',
                      fontWeight: 900,
                      fontSize: '0.74rem',
                      cursor: 'pointer',
                    }}
                  >
                    📒 Full Khata (₹{totals.finalTotal})
                  </button>
                  <button
                    type="button"
                    onClick={() => setKhataSplitEnabled(true)}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      borderRadius: '8px',
                      border: khataSplitEnabled ? '2px solid #2563eb' : '1px solid #cbd5e1',
                      background: khataSplitEnabled ? '#2563eb' : '#fff',
                      color: khataSplitEnabled ? '#fff' : '#334155',
                      fontWeight: 900,
                      fontSize: '0.74rem',
                      cursor: 'pointer',
                    }}
                  >
                    ⚖️ Split: Pay Now + Rest Khata
                  </button>
                </div>

                {khataSplitEnabled && (
                  <div style={{ padding: '8px', background: '#fff', borderRadius: '8px', border: '1px solid #fde68a', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
                      <input
                        type="number"
                        min="0"
                        max={totals.finalTotal}
                        placeholder="Paid now (₹)"
                        value={khataPaidNow}
                        onChange={(e) => setKhataPaidNow(e.target.value)}
                        style={{ flex: 1, padding: '6px 8px', borderRadius: '6px', border: '1.5px solid #2563eb', fontWeight: 900, fontSize: '0.84rem' }}
                      />
                      <button
                        type="button"
                        onClick={() => setKhataPaidVia('CASH')}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: khataPaidVia === 'CASH' ? '2px solid #16a34a' : '1px solid #cbd5e1',
                          background: khataPaidVia === 'CASH' ? '#dcfce7' : '#fff',
                          color: '#166534',
                          fontWeight: 800,
                          fontSize: '0.74rem',
                          cursor: 'pointer',
                        }}
                      >
                        💵 Cash
                      </button>
                      <button
                        type="button"
                        onClick={() => setKhataPaidVia('UPI')}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: khataPaidVia === 'UPI' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                          background: khataPaidVia === 'UPI' ? '#dbeafe' : '#fff',
                          color: '#1e40af',
                          fontWeight: 800,
                          fontSize: '0.74rem',
                          cursor: 'pointer',
                        }}
                      >
                        📱 UPI
                      </button>
                    </div>
                    {totals.finalTotal > 0 && (
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                        {[
                          { label: '25%', val: Math.round(totals.finalTotal * 0.25) },
                          { label: '50%', val: Math.round(totals.finalTotal * 0.5) },
                          { label: '₹100', val: Math.min(totals.finalTotal, 100) },
                          { label: '₹500', val: Math.min(totals.finalTotal, 500) },
                        ].map((q) => (
                          <button
                            key={q.label}
                            type="button"
                            onClick={() => setKhataPaidNow(String(q.val))}
                            style={{ padding: '2px 8px', borderRadius: '5px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}
                          >
                            {q.label} (₹{q.val})
                          </button>
                        ))}
                      </div>
                    )}

                    {khataPaidVia === 'UPI' && khataPreview.paidNowNum > 0 && hasShopUpi && (
                      <div style={{ marginTop: '8px', padding: '8px', borderRadius: '8px', background: '#eff6ff', border: '1px dashed #3b82f6', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img
                          src={upiQrImageUrl}
                          alt="Split UPI QR"
                          style={{ width: '68px', height: '68px', borderRadius: '6px', background: '#fff', border: '1px solid #bfdbfe' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 900, fontSize: '0.78rem', color: '#1e3a8a' }}>
                            Scan Split Pay: ₹{khataPreview.paidNowNum}
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowFullscreenUpi(true)}
                            style={{ marginTop: '4px', padding: '3px 8px', borderRadius: '5px', border: '1px solid #3b82f6', background: '#fff', color: '#1d4ed8', fontWeight: 800, fontSize: '0.68rem', cursor: 'pointer' }}
                          >
                            🔍 Fullscreen QR
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* LIVE KHATA LEDGER IMPACT PREVIEW */}
                <div style={{ fontSize: '0.76rem', color: '#78350f', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Previous Pending Khata:</span>
                    <strong>₹{khataPreview.prevBalance}</strong>
                  </div>
                  {khataSplitEnabled && khataPreview.paidNowNum > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#15803d', fontWeight: 800 }}>
                      <span>Paid Now ({khataPaidVia}):</span>
                      <span>₹{khataPreview.paidNowNum} ✅</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                    <span>Added to Khata Today:</span>
                    <span style={{ color: '#b45309' }}>+₹{khataPreview.addedToKhata}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #d97706', paddingTop: '4px', marginTop: '2px', fontSize: '0.84rem', fontWeight: 900, color: '#92400e' }}>
                    <span>Net Total Khata Payable:</span>
                    <span>₹{khataPreview.newTotalKhataPayable}</span>
                  </div>
                  {khataPreview.willExceedLimit && (
                    <div style={{ marginTop: '4px', padding: '4px 8px', borderRadius: '6px', background: '#fee2e2', color: '#b91c1c', fontWeight: 900, fontSize: '0.72rem' }}>
                      ⚠️ Exceeds Credit Limit of ₹{khataPreview.creditLimit} (can still save if you approve)
                    </div>
                  )}
                  {(!/^[6-9]\d{9}$/.test(customerPhone.replace(/\D/g, '').slice(-10)) ||
                    (!customerName.trim() && !customerLookup?.user?.name && !customerLookup?.khata?.customerName)) && (
                      <div style={{ marginTop: '4px', padding: '4px 8px', borderRadius: '6px', background: '#fef2f2', color: '#b91c1c', fontWeight: 800, fontSize: '0.71rem' }}>
                        ⚠️ Enter 10-digit Mobile Number &amp; Customer Name above to record Khata.
                      </div>
                    )}
                </div>
              </div>
            )}
          </div>

          {/* 🚀 CHECKOUT ACTION BUTTONS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              type="button"
              disabled={isSubmitting || billItems.length === 0}
              onClick={() => handleCompleteBill({ sendWhatsApp: true })}
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: '12px',
                border: 'none',
                background: billItems.length === 0
                  ? '#94a3b8'
                  : paymentMethod === 'KHATA'
                    ? 'linear-gradient(135deg, #d97706 0%, #b45309 100%)'
                    : 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '0.92rem',
                cursor: billItems.length === 0 ? 'not-allowed' : 'pointer',
                boxShadow: billItems.length === 0 ? 'none' : '0 6px 18px rgba(22, 163, 74, 0.3)',
              }}
            >
              {isSubmitting
                ? '⏳ Saving Counter Bill…'
                : paymentMethod === 'KHATA'
                  ? (khataSplitEnabled && khataPreview.paidNowNum > 0
                    ? `⚖️ Save Split Bill (₹${khataPreview.paidNowNum} + ₹${khataPreview.addedToKhata} Khata)`
                    : `📒 Save Khata Bill (+₹${totals.finalTotal}) & WhatsApp`)
                  : `📲 Complete & Send WhatsApp Bill (₹${totals.finalTotal})`}
            </button>

            <button
              type="button"
              disabled={isSubmitting || billItems.length === 0}
              onClick={() => handleCompleteBill({ sendWhatsApp: false })}
              style={{
                width: '100%',
                padding: '9px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                background: '#f1f5f9',
                color: '#0f172a',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: billItems.length === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              ⚡ Quick Save Bill (Without WhatsApp) [Ctrl+Enter]
            </button>
          </div>
        </div>
      </div>

      {/* ================= 📜 3. RECENT WALK-IN COUNTER BILLS & CRM ================= */}
      <div style={{ background: '#ffffff', borderRadius: '18px', padding: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a', fontWeight: 900 }}>
              📜 Recent Walk-in Counter Bills ({posOrders.length})
            </h3>
            <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
              Storefront Link:{' '}
              <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>
                {getShopStorefrontUrl(shopData._id, shopData.pincode)}
              </strong>
            </div>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: 'All Bills' },
              { id: 'CASH', label: '💵 Cash' },
              { id: 'UPI', label: '📱 UPI' },
              { id: 'KHATA', label: '📒 Khata' },
              { id: 'CONVERTED', label: '🚀 Converted' },
            ].map(f => {
              const active = recentBillsFilter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setRecentBillsFilter(f.id)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '999px',
                    border: active ? '1.5px solid #0f172a' : '1px solid #cbd5e1',
                    background: active ? '#0f172a' : '#fff',
                    color: active ? '#fff' : '#475569',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search input for bills */}
        <div style={{ marginBottom: '12px' }}>
          <input
            type="text"
            placeholder="Search recent bills by bill #, customer name, phone, or item name…"
            value={recentBillsSearch}
            onChange={(e) => setRecentBillsSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '0.82rem',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {filteredRecentBills.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '0.86rem' }}>
            {recentBillsSearch ? 'No matching bills found.' : 'No counter bills created yet.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredRecentBills.slice(0, recentBillsLimit).map((po) => {
              const shortId = String(po._id || '').slice(-5).toUpperCase();
              const custName = po.userId?.name || po.customerName || 'Walk-in Customer';
              const custPhone = po.userId?.phone || po.customerPhone || '';
              const itemCount = Array.isArray(po.items) ? po.items.reduce((s, i) => s + (Number(i?.qty) || 1), 0) : 0;
              const khataMeta = extractKhataMeta(po);
              const isKhataBill = po.paymentMethod === 'KHATA';
              const isKhataSettled = isKhataBill && po.paymentStatus === 'Paid';
              const isSplitKhata = isKhataBill && (Number(po.paidAmount) || 0) > 0 && khataMeta.addedToKhata > 0;
              let payBadgeText = po.paymentMethod || 'CASH';
              let payBadgeBg = po.paymentMethod === 'UPI' ? '#dbeafe' : '#dcfce7';
              let payBadgeFg = po.paymentMethod === 'UPI' ? '#1e40af' : '#15803d';
              if (isKhataSettled) {
                payBadgeText = '✅ KHATA SETTLED';
                payBadgeBg = '#dcfce7';
                payBadgeFg = '#15803d';
              } else if (isSplitKhata) {
                payBadgeText = `⚖️ SPLIT: ₹${po.paidAmount} Paid / ₹${khataMeta.addedToKhata} Khata`;
                payBadgeBg = '#fef3c7';
                payBadgeFg = '#92400e';
              } else if (isKhataBill) {
                payBadgeText = `📒 KHATA DUE (₹${khataMeta.addedToKhata || po.totalAmount})`;
                payBadgeBg = '#fef3c7';
                payBadgeFg = '#92400e';
              }
              return (
                <div
                  key={po._id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 900, color: '#0f172a', fontSize: '0.88rem' }}>
                        #{shortId} • ₹{po.totalAmount}
                      </span>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '999px',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        background: payBadgeBg,
                        color: payBadgeFg,
                      }}>
                        {payBadgeText}
                      </span>
                      {khataMeta.scenario === 'FIRST_KHATA' && (
                        <span style={{ padding: '2px 7px', borderRadius: '999px', fontSize: '0.66rem', fontWeight: 900, background: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe' }}>
                          🆕 1st Khata
                        </span>
                      )}
                      {po.convertedToOnlineUser && (
                        <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 800, background: '#ecfdf5', color: '#047857', border: '1px solid #6ee7b7' }}>
                          🚀 Converted
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                      👤 {custName} {custPhone ? `(${custPhone})` : ''} • {itemCount} units • {new Date(po.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(po.createdAt).toLocaleDateString()})
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {(isKhataBill || khataMeta.scenario === 'PAID_WITH_OLD_KHATA') && onOpenKhataBook && custPhone && (
                      <button
                        type="button"
                        onClick={() => onOpenKhataBook(custPhone)}
                        style={{ padding: '6px 9px', borderRadius: '8px', border: '1px solid #f59e0b', background: '#fffbeb', color: '#92400e', fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer' }}
                        title="Open Customer Khata Ledger"
                      >
                        📒 Khata
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        sendBillToCustomerWhatsApp(
                          { ...po, customerPhone: po.customerPhone || po.userId?.phone || '' },
                          shopData,
                          { toast }
                        );
                      }}
                      style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #86efac', background: '#f0fdf4', color: '#15803d', fontWeight: 800, fontSize: '0.74rem', cursor: 'pointer' }}
                      title="Send PDF Bill on WhatsApp"
                    >
                      📲 WhatsApp PDF
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          toast('Generating PDF bill…', 'info');
                          await downloadReceiptPdf(po, shopData);
                          toast('📄 PDF Bill Downloaded!', 'success');
                        } catch {
                          toast('Could not generate PDF bill', 'error');
                        }
                      }}
                      style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#1d4ed8', fontWeight: 800, fontSize: '0.74rem', cursor: 'pointer' }}
                      title="Download Official PDF Receipt"
                    >
                      📄 PDF Bill
                    </button>
                    <a
                      href={getPublicBillUrl(po._id, shopData._id, shopData.pincode)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#334155', fontWeight: 800, fontSize: '0.74rem', textDecoration: 'none' }}
                    >
                      🌐 Web Bill
                    </a>
                    <button
                      type="button"
                      onClick={() => setPrintingOrder(po)}
                      style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', fontWeight: 800, fontSize: '0.74rem', cursor: 'pointer' }}
                    >
                      🖨️ Print
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredRecentBills.length > recentBillsLimit && (
              <button
                type="button"
                onClick={() => setRecentBillsLimit(v => v + 15)}
                style={{ marginTop: '8px', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}
              >
                Load More Bills ({filteredRecentBills.length - recentBillsLimit} remaining)
              </button>
            )}
          </div>
        )}
      </div>

      {/* ================= 🖨️ THERMAL ROLL PRINT MODAL (58mm / 80mm ESC/POS READY) ================= */}
      {printingOrder && (
        <div
          onClick={() => setPrintingOrder(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              width: '100%',
              maxWidth: '340px',
              borderRadius: '16px',
              padding: '18px',
              fontFamily: 'monospace',
              boxShadow: '0 25px 60px rgba(0,0,0,0.35)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            {/* Print Container with printable ID */}
            <div id="pos-thermal-print-area">
              <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '8px', marginBottom: '8px' }}>
                <div style={{ fontWeight: 900, fontSize: '1.1rem', textTransform: 'uppercase' }}>{shopData.name}</div>
                {shopData.fullAddress && <div style={{ fontSize: '0.74rem' }}>{shopData.fullAddress}</div>}
                <div style={{ fontSize: '0.74rem' }}>Ph: {shopData.phone}</div>
                {shopData.gst && <div style={{ fontSize: '0.72rem' }}>GSTIN: {shopData.gst}</div>}
              </div>

              <div style={{ fontSize: '0.74rem', borderBottom: '1px dashed #000', paddingBottom: '6px', marginBottom: '8px' }}>
                <div>Bill #{String(printingOrder._id).slice(-5).toUpperCase()} ({printingOrder.paymentMethod})</div>
                <div>Date: {new Date(printingOrder.createdAt).toLocaleString()}</div>
                <div>Customer: {printingOrder.customerName || 'Walk-in'} {printingOrder.customerPhone ? `(${printingOrder.customerPhone})` : ''}</div>
              </div>

              {/* Items Table */}
              <div style={{ fontSize: '0.76rem', borderBottom: '1px dashed #000', paddingBottom: '8px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, borderBottom: '1px dotted #ccc', paddingBottom: '3px', marginBottom: '4px' }}>
                  <span>Item</span>
                  <span>Amount</span>
                </div>
                {(printingOrder.items || []).map((it, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <span style={{ maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {it.qty}x {it.name}
                    </span>
                    <span>₹{Math.round((Number(it.price) || 0) * (Number(it.qty) || 1) * 100) / 100}</span>
                  </div>
                ))}
              </div>

              {/* Totals Summary */}
              <div style={{ fontSize: '0.82rem', fontWeight: 900, borderBottom: '1px dashed #000', paddingBottom: '8px', marginBottom: '8px' }}>
                {printingOrder.discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                    <span>Discount:</span>
                    <span>-₹{printingOrder.discountAmount}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', marginTop: '4px' }}>
                  <span>GRAND TOTAL:</span>
                  <span>₹{printingOrder.totalAmount}</span>
                </div>
                {printingOrder.savingsAmount > 0 && (
                  <div style={{ textAlign: 'center', fontSize: '0.72rem', marginTop: '4px', fontStyle: 'italic' }}>
                    *** You Saved ₹{printingOrder.savingsAmount} on MRP! ***
                  </div>
                )}
              </div>

              {/* KHATA LEDGER BLOCK ON THERMAL PRINT */}
              {(() => {
                const km = extractKhataMeta(printingOrder);
                if (km.scenario === 'NORMAL') return null;
                return (
                  <div style={{ fontSize: '0.74rem', borderBottom: '1px dashed #000', paddingBottom: '8px', marginBottom: '8px' }}>
                    {km.scenario === 'FIRST_KHATA' && (
                      <>
                        <div style={{ fontWeight: 900, textAlign: 'center', marginBottom: '4px' }}>
                          *** NEW KHATA ACCOUNT (FIRST ENTRY) ***
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Previous Khata:</span>
                          <span>Rs.0</span>
                        </div>
                        {km.paidNow > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Paid Now ({km.paidVia}):</span>
                            <span>Rs.{km.paidNow}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Added to Khata:</span>
                          <span>+Rs.{km.addedToKhata}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, marginTop: '3px', borderTop: '1px dotted #000', paddingTop: '3px' }}>
                          <span>NET KHATA DUE:</span>
                          <span>Rs.{km.netKhataPayable}</span>
                        </div>
                      </>
                    )}
                    {km.scenario === 'REPEAT_KHATA' && (
                      <>
                        <div style={{ fontWeight: 900, textAlign: 'center', marginBottom: '4px' }}>
                          *** KHATA ACCOUNT SUMMARY ***
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Previous Pending:</span>
                          <span>Rs.{km.previousBalance}</span>
                        </div>
                        {km.paidNow > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Paid Now ({km.paidVia}):</span>
                            <span>Rs.{km.paidNow}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Added This Bill:</span>
                          <span>+Rs.{km.addedToKhata}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, marginTop: '3px', borderTop: '1px dotted #000', paddingTop: '3px' }}>
                          <span>{km.isSettled ? 'KHATA SETTLED:' : 'TOTAL KHATA DUE:'}</span>
                          <span>Rs.{km.isSettled ? 0 : km.netKhataPayable}</span>
                        </div>
                      </>
                    )}
                    {km.scenario === 'PAID_WITH_OLD_KHATA' && (
                      <div style={{ textAlign: 'center', fontWeight: 900 }}>
                        NOTE: Prior Unpaid Khata Balance: Rs.{km.previousBalance}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* QR / Online Store Footer */}
              <div style={{ textAlign: 'center', fontSize: '0.72rem', marginBottom: '10px' }}>
                <div>Order Online from {shopData.name}:</div>
                <div style={{ wordBreak: 'break-all', fontWeight: 700, marginTop: '2px' }}>
                  {getShopStorefrontUrl(shopData._id, shopData.pincode)}
                </div>
                <div style={{ marginTop: '4px', fontSize: '0.68rem', color: '#555' }}>
                  Thank you for shopping local! 🙏
                </div>
              </div>
            </div>

            {/* Modal Buttons */}
            <div className="pos-no-print" style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button
                type="button"
                onClick={() => window.print()}
                style={{ flex: 1, padding: '10px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 900, cursor: 'pointer' }}
              >
                🖨️ Print Now
              </button>
              <button
                type="button"
                onClick={() => setPrintingOrder(null)}
                style={{ padding: '10px 14px', background: '#e2e8f0', color: '#0f172a', border: 'none', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= 📱 FULLSCREEN SCAN-TO-PAY UPI QR MODAL ================= */}
      {showFullscreenUpi && activeUpiAmount > 0 && hasShopUpi && (
        <div
          onClick={() => setShowFullscreenUpi(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.85)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              padding: '28px 24px',
              textAlign: 'center',
              maxWidth: '360px',
              width: '100%',
              boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
            }}
          >
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              ⚡ Instant UPI Counter Pay
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a', margin: '4px 0 12px' }}>
              ₹{activeUpiAmount}
            </div>

            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '16px', border: '2px solid #e2e8f0', display: 'inline-block', marginBottom: '14px' }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(upiIntentUri)}`}
                alt="Dynamic UPI QR"
                style={{ width: '220px', height: '220px', display: 'block' }}
              />
            </div>

            <div style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 700 }}>
              Scan with PhonePe, GPay, Paytm, or BHIM
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
              UPI ID: {shopData.upiId}
            </div>

            <button
              type="button"
              onClick={() => setShowFullscreenUpi(false)}
              style={{
                marginTop: '16px',
                width: '100%',
                padding: '12px',
                background: '#0f172a',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 900,
                fontSize: '0.88rem',
                cursor: 'pointer',
              }}
            >
              Done / Close
            </button>
          </div>
        </div>
      )}

      {/* ================= ⌨️ KEYBOARD SHORTCUTS CHEAT SHEET MODAL ================= */}
      {showShortcutsModal && (
        <div
          onClick={() => setShowShortcutsModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '24px',
              maxWidth: '420px',
              width: '100%',
              boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: 900 }}>
                ⌨️ Counter POS Shortcuts
              </h3>
              <button
                type="button"
                onClick={() => setShowShortcutsModal(false)}
                style={{ border: 'none', background: 'transparent', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { key: 'F2', action: 'Focus Search & Barcode Input' },
                { key: 'F4', action: 'Cycle Payment Mode (Cash → UPI → Khata)' },
                { key: 'Enter', action: 'Add First Search Result to Bill' },
                { key: 'Ctrl + Enter', action: 'Save Counter Bill (Fast Checkout)' },
                { key: 'Ctrl + Shift + Enter', action: 'Save & Send WhatsApp Bill' },
                { key: 'Escape', action: 'Clear Search or Close Modals' },
                { key: 'USB Gun', action: 'Scan any barcode anytime (Auto-detect)' },
              ].map(s => (
                <div key={s.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.84rem', color: '#334155', fontWeight: 600 }}>{s.action}</span>
                  <kbd style={{ background: '#0f172a', color: '#fff', padding: '3px 8px', borderRadius: '6px', fontSize: '0.76rem', fontWeight: 900 }}>{s.key}</kbd>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowShortcutsModal(false)}
              style={{
                marginTop: '16px',
                width: '100%',
                padding: '10px',
                background: '#f1f5f9',
                color: '#0f172a',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* ================= 💰 INLINE QUICK SETTLE KHATA MODAL ================= */}
      {quickSettleTarget && (
        <div
          onClick={() => setQuickSettleTarget(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.72)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <form
            onSubmit={handleQuickSettleSubmit}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '22px',
              maxWidth: '380px',
              width: '100%',
              boxShadow: '0 25px 60px rgba(0,0,0,0.35)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '1.08rem', color: '#0f172a', fontWeight: 900 }}>
                💰 Collect Old Khata Due
              </h3>
              <button
                type="button"
                onClick={() => setQuickSettleTarget(null)}
                style={{ border: 'none', background: 'transparent', fontSize: '1.15rem', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: '10px 12px', borderRadius: '10px', background: '#fffbeb', border: '1px solid #fcd34d', marginBottom: '12px', fontSize: '0.82rem' }}>
              <div style={{ fontWeight: 900, color: '#92400e' }}>
                {quickSettleTarget.customerName} ({quickSettleTarget.customerPhone})
              </div>
              <div style={{ color: '#b45309', fontWeight: 800, marginTop: '2px' }}>
                Total Pending Khata Balance: <strong>₹{quickSettleTarget.currentBalance}</strong>
              </div>
            </div>

            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '5px' }}>
              Amount Received Today (₹)
            </label>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
              <input
                type="number"
                min="1"
                step="0.01"
                max={quickSettleTarget.currentBalance}
                value={quickSettleAmt}
                onChange={(e) => setQuickSettleAmt(e.target.value)}
                required
                style={{ flex: 1, padding: '10px 12px', borderRadius: '10px', border: '2px solid #16a34a', fontWeight: 900, fontSize: '1rem' }}
              />
              <button
                type="button"
                onClick={() => setQuickSettleAmt(String(quickSettleTarget.currentBalance))}
                style={{ padding: '0 12px', borderRadius: '10px', border: '1px solid #86efac', background: '#f0fdf4', color: '#15803d', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}
              >
                Full ₹{quickSettleTarget.currentBalance}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
              {[
                { id: 'CASH', label: '💵 Cash Received' },
                { id: 'UPI', label: '📱 UPI Received' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setQuickSettleMode(m.id)}
                  style={{
                    padding: '9px',
                    borderRadius: '10px',
                    border: quickSettleMode === m.id ? '2px solid #16a34a' : '1px solid #cbd5e1',
                    background: quickSettleMode === m.id ? '#dcfce7' : '#fff',
                    color: quickSettleMode === m.id ? '#166534' : '#334155',
                    fontWeight: 900,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={isSettlingKhata}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                color: '#fff',
                fontWeight: 900,
                fontSize: '0.92rem',
                cursor: isSettlingKhata ? 'wait' : 'pointer',
              }}
            >
              {isSettlingKhata ? 'Saving Jama Entry…' : `✅ Record ₹${quickSettleAmt || 0} Payment`}
            </button>
          </form>
        </div>
      )}

      {/* STRICT THERMAL ROLL PRINT STYLES */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #pos-thermal-print-area, #pos-thermal-print-area * {
            visibility: visible !important;
          }
          #pos-thermal-print-area {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 300px !important;
            margin: 0 auto !important;
            padding: 8px !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
          .pos-no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

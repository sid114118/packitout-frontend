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

const LOOSE_PRESETS = [
  { label: '🍬 Loose Sugar (Chini)', name: 'Loose Sugar (Chini)', qnty: '1 kg', emoji: '🍬' },
  { label: '🌾 Loose Rice (Chawal)', name: 'Loose Rice (Chawal)', qnty: '1 kg', emoji: '🌾' },
  { label: '🫘 Loose Dal / Pulses', name: 'Loose Toor / Moong Dal', qnty: '1 kg', emoji: '🫘' },
  { label: '🌾 Loose Atta / Flour', name: 'Loose Chakki Atta', qnty: '1 kg', emoji: '🌾' },
  { label: '🥦 Fresh Vegetables', name: 'Fresh Vegetables', qnty: '1 lot', emoji: '🥦' },
  { label: '🥛 Milk / Curd', name: 'Dairy / Milk Packet', qnty: '1 pkt', emoji: '🥛' },
  { label: '🛍️ Kirana / Loose Item', name: 'General Kirana Item', qnty: '1 unit', emoji: '🛍️' },
];

export default function CounterPosTab({
  shopData,
  masterCatalog = [],
  orders = [],
  onBillCreated,
}) {
  const toast = useToast();
  const posEnabled = Boolean(shopData?.canUseCounterPos);

  // --- LIVE BILL STATE ---
  const [billItems, setBillItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH'); // CASH | UPI | KHATA
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerLookup, setCustomerLookup] = useState(null);
  const [isLookingUpCustomer, setIsLookingUpCustomer] = useState(false);
  const [redeemCoins, setRedeemCoins] = useState(false);

  // --- QUICK CUSTOM / LOOSE ITEM STATE ---
  const [customName, setCustomName] = useState('');
  const [customQnty, setCustomQnty] = useState('1 unit');
  const [customPrice, setCustomPrice] = useState('');
  const [customQty, setCustomQty] = useState(1);

  // --- SUBMISSION & POST-CHECKOUT RECEIPT MODAL ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastCompletedBill, setLastCompletedBill] = useState(null);
  const [printingOrder, setPrintingOrder] = useState(null);
  const [scannerListening, setScannerListening] = useState(true);
  const [lastScannedCode, setLastScannedCode] = useState('');

  const searchInputRef = useRef(null);
  const customPriceInputRef = useRef(null);
  const scanBufferRef = useRef({ chars: '', lastTime: 0 });

  // crisp POS beep using Web Audio API
  const playPosBeep = (success = true) => {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = success ? 'sine' : 'sawtooth';
      osc.frequency.setValueAtTime(success ? 1150 : 320, ctx.currentTime);
      gain.gain.setValueAtTime(0.14, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + (success ? 0.08 : 0.18));
    } catch {
      /* ignore audio errors */
    }
  };

  // --- INDEXED SHOP INVENTORY ---
  const validInventory = useMemo(() => {
    return (shopData?.inventory || []).filter(item => item && item.product);
  }, [shopData?.inventory]);

  // --- SEARCH RESULTS ---
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return validInventory.slice(0, 12);
    const tokens = q.split(/\s+/).filter(Boolean);
    const matches = [];
    for (const inv of validInventory) {
      const p = inv.product;
      const tagsStr = Array.isArray(p.searchTags) ? p.searchTags.join(' ') : (p.searchTags || '');
      const hay = `${p.name || ''} ${p.brand || ''} ${p.category || ''} ${p.barcode || ''} ${tagsStr}`.toLowerCase();
      if (tokens.every(t => hay.includes(t))) {
        matches.push(inv);
        if (matches.length >= 24) break;
      }
    }
    return matches;
  }, [validInventory, searchQuery]);

  // --- ADD ITEM HELPERS ---
  const addInventoryItemToBill = (invItem) => {
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
            ? { ...i, qty: Number(i.qty || 1) + 1 }
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
          qty: 1,
        },
      ];
    });
  };

  const addCustomItemToBill = (e) => {
    if (e) e.preventDefault();
    const priceNum = Number(customPrice);
    if (!customName.trim()) {
      toast('Enter item name (or click a loose item preset above)', 'error');
      return;
    }
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      toast('Enter a valid price (₹)', 'error');
      return;
    }
    const qtyNum = Math.max(1, Math.floor(Number(customQty) || 1));
    const rowId = `pos_custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setBillItems(prev => [
      ...prev,
      {
        rowId,
        productId: rowId,
        isCustomItem: true,
        name: customName.trim(),
        brand: 'Counter Item',
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
    setCustomQnty('1 unit');
    playPosBeep(true);
  };

  // --- BARCODE SCANNER HANDLER ---
  const handleBarcodeLookup = (rawCode) => {
    const clean = String(rawCode || '').trim();
    if (!clean) return;
    setLastScannedCode(clean);

    // 1. Check Shop Inventory first
    const inShop = validInventory.find(
      inv => String(inv.product?.barcode || '').trim().toLowerCase() === clean.toLowerCase()
    );
    if (inShop) {
      playPosBeep(true);
      addInventoryItemToBill(inShop);
      toast(`⚡ Added: ${inShop.product.name} (₹${inShop.sellingPrice || inShop.product.mrp})`);
      return;
    }

    // 2. Check Master Catalog
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
      toast(`📦 Catalog Match Added: ${inMaster.name} (MRP ₹${unitMrp})`);
      return;
    }

    // 3. Unknown Barcode -> Pre-fill Custom Item row & focus Price
    playPosBeep(false);
    setCustomName(`Scanned Item (${clean})`);
    toast(`🆕 Unlinked Barcode ${clean} — Enter price to add to bill!`, 'info');
    setTimeout(() => customPriceInputRef.current?.focus(), 60);
  };

  // Global USB / Bluetooth Barcode Gun Listener
  useEffect(() => {
    if (!posEnabled || !scannerListening) return;

    const onKeyDown = (e) => {
      // Shortcut: Press F2 to jump to product search
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      const tag = (e.target?.tagName || '').toUpperCase();
      const isTypingInInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
      if (isTypingInInput) return;

      const now = Date.now();
      const gap = now - scanBufferRef.current.lastTime;

      if (e.key === 'Enter') {
        if (scanBufferRef.current.chars.length >= 4 && gap < 150) {
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
        if (gap > 120) {
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
  }, [posEnabled, scannerListening, validInventory, masterCatalog]);

  // --- AUTO CUSTOMER LOOKUP WHEN 10 DIGITS ENTERED ---
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
          if (data.found && data.user?.name && !customerName.trim()) {
            setCustomerName(data.user.name);
          }
        }
      } catch {
        /* ignore */
      }
      if (!cancelled) setIsLookingUpCustomer(false);
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerPhone, posEnabled, shopData?._id]);

  // --- BILL TOTALS CALCULATION ---
  const totals = useMemo(() => {
    let mrpTotal = 0;
    let subtotal = 0;
    let totalUnits = 0;

    for (const item of billItems) {
      const qty = Math.max(1, Number(item.qty) || 1);
      const price = Math.max(0, Number(item.price) || 0);
      const mrp = Math.max(price, Number(item.mrp) || price);
      mrpTotal += mrp * qty;
      subtotal += price * qty;
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
      totalUnits,
      estimatedCoinsEarned,
      isNewWalkin,
    };
  }, [billItems, discountAmount, redeemCoins, customerLookup, customerPhone]);

  // --- TODAY'S POS STATS & RECENT POS BILLS ---
  const posOrders = useMemo(() => {
    return (orders || []).filter(o => o && o.orderSource === 'POS');
  }, [orders]);

  const todayStats = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    let revenue = 0;
    let count = 0;
    let cashTotal = 0;
    let upiTotal = 0;
    let convertedCount = 0;

    for (const o of posOrders) {
      const dt = new Date(o.createdAt);
      if (dt >= startOfToday && !/cancel|reject/i.test(o.status || '')) {
        const amt = Number(o.totalAmount) || 0;
        revenue += amt;
        count += 1;
        if (o.paymentMethod === 'UPI') upiTotal += amt;
        else if (o.paymentMethod === 'CASH') cashTotal += amt;
        if (o.convertedToOnlineUser) convertedCount += 1;
      }
    }

    return {
      revenue: Math.round(revenue),
      count,
      cashTotal: Math.round(cashTotal),
      upiTotal: Math.round(upiTotal),
      convertedCount,
    };
  }, [posOrders]);

  // --- SUBMIT COUNTER BILL ---
  const handleCompleteBill = async ({ sendWhatsApp = false } = {}) => {
    if (billItems.length === 0) {
      toast('Add at least 1 item to the counter bill first!', 'error');
      return;
    }

    const cleanPhone = customerPhone.replace(/\D/g, '').slice(-10);
    if (sendWhatsApp && !/^[6-9]\d{9}$/.test(cleanPhone)) {
      toast('Enter a valid 10-digit customer WhatsApp number to send the bill + online store link!', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        items: billItems,
        discountAmount: Number(discountAmount) || 0,
        paymentMethod,
        customerPhone: /^[6-9]\d{9}$/.test(cleanPhone) ? cleanPhone : '',
        customerName: customerName.trim(),
        redeemCoins,
      };

      const res = await shopFetch(shopData, `/shops/${shopData._id}/pos-bills`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(data.error || 'Failed to create counter bill', 'error');
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
      });

      // Reset live counter form for the next customer in queue
      setBillItems([]);
      setDiscountAmount('');
      setCustomerPhone('');
      setCustomerName('');
      setCustomerLookup(null);
      setRedeemCoins(false);

      if (onBillCreated) {
        onBillCreated(data.shop, createdOrder);
      }

      if (data.convertedToOnlineUser) {
        toast(`🎉 Bill Saved + Walk-in Customer Converted to Online User (+${data.coinsEarned} Coins)!`);
      } else {
        toast(`✅ Counter Bill #${String(createdOrder._id).slice(-5).toUpperCase()} Completed!`);
      }

      if (sendWhatsApp && cleanPhone) {
        const msg = buildPosCounterBillWhatsApp(createdOrder, shopData, {
          customerName: createdOrder.customerName,
          savingsAmount: createdOrder.savingsAmount,
          discountAmount: createdOrder.discountAmount,
          coinsEarned: data.coinsEarned,
          totalCoins: data.customer?.coins,
        });
        openWhatsAppChat(cleanPhone, msg);
      }
    } catch (err) {
      toast('Network error while saving counter bill', 'error');
    }
    setIsSubmitting(false);
  };

  // --- ADMIN GATE SCREEN IF NOT ENABLED ---
  if (!posEnabled) {
    return (
      <div style={{ background: '#ffffff', borderRadius: '18px', padding: '36px 24px', textAlign: 'center', boxShadow: '0 8px 24px rgba(15,23,42,0.06)', border: '2px dashed #cbd5e1', marginTop: '15px' }}>
        <div style={{ fontSize: '3.2rem', marginBottom: '12px' }}>⚡🧾</div>
        <h2 style={{ margin: '0 0 8px', color: '#0f172a', fontSize: '1.35rem', fontWeight: 900 }}>
          Fast Counter POS + Offline-to-Online Converter
        </h2>
        <p style={{ color: '#475569', maxWidth: '520px', margin: '0 auto 18px', lineHeight: 1.6, fontSize: '0.92rem' }}>
          Bill walk-in customers in 5 seconds with a USB Barcode Scanner or 1-tap loose item buttons, show a dynamic UPI QR code on screen, and automatically convert walk-in customers into repeat online buyers via WhatsApp Digital Bills!
        </p>
        <div style={{ display: 'inline-block', background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', padding: '10px 18px', borderRadius: '10px', fontWeight: 800, fontSize: '0.85rem' }}>
          🔒 This Pro SaaS feature is controlled by Admin. Ask PackItOut Admin to enable &ldquo;⚡ Counter POS&rdquo; for your shop!
        </div>
      </div>
    );
  }

  // Dynamic UPI QR URL for exact bill amount
  const hasShopUpi = Boolean(shopData?.upiId && String(shopData.upiId).includes('@'));
  const upiIntentUri = hasShopUpi && totals.finalTotal > 0
    ? `upi://pay?pa=${encodeURIComponent(shopData.upiId)}&pn=${encodeURIComponent(shopData.name || 'Store')}&am=${totals.finalTotal}&cu=INR&tn=${encodeURIComponent('Store Bill')}`
    : '';
  const upiQrImageUrl = upiIntentUri
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=6&data=${encodeURIComponent(upiIntentUri)}`
    : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* 📊 1. TODAY'S COUNTER REGISTER SUMMARY STRIP */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#fff',
        padding: '16px 18px',
        borderRadius: '16px',
        boxShadow: '0 8px 22px rgba(15, 23, 42, 0.16)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))',
        gap: '12px',
        alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
            ⚡ Today's Counter Sales
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#34d399', marginTop: '2px' }}>
            ₹{todayStats.revenue}
          </div>
          <div style={{ fontSize: '0.73rem', color: '#cbd5e1' }}>
            {todayStats.count} Walk-in Bill{todayStats.count !== 1 ? 's' : ''} Today
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
            💵 Cash vs 📱 UPI
          </div>
          <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>
            Cash: ₹{todayStats.cashTotal}
          </div>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#38bdf8' }}>
            UPI: ₹{todayStats.upiTotal}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
            🚀 Offline → Online Converted
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fbbf24', marginTop: '2px' }}>
            {todayStats.convertedCount} Customer{todayStats.convertedCount !== 1 ? 's' : ''}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
            Joined your Online Store today
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
          <button
            type="button"
            onClick={() => setScannerListening(v => !v)}
            style={{
              padding: '7px 12px',
              borderRadius: '999px',
              border: scannerListening ? '1px solid #34d399' : '1px solid #64748b',
              background: scannerListening ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255,255,255,0.08)',
              color: scannerListening ? '#6ee7b7' : '#cbd5e1',
              fontWeight: 800,
              fontSize: '0.76rem',
              cursor: 'pointer',
            }}
          >
            {scannerListening ? '🔫 USB Gun: READY (Auto-Scan)' : '🔫 USB Gun: PAUSED'}
          </button>
          {lastScannedCode && (
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace' }}>
              Last Scan: {lastScannedCode}
            </span>
          )}
        </div>
      </div>

      {/* 🎉 POST-CHECKOUT SUCCESS BANNER (Share / Print / View Web Link) */}
      {lastCompletedBill && (
        <div style={{
          background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
          border: '2px solid #10b981',
          borderRadius: '16px',
          padding: '14px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div>
            <div style={{ fontWeight: 900, color: '#065f46', fontSize: '0.96rem' }}>
              ✅ Last Bill #{String(lastCompletedBill.order._id).slice(-5).toUpperCase()} • ₹{lastCompletedBill.order.totalAmount} ({lastCompletedBill.order.paymentMethod})
              {lastCompletedBill.convertedToOnlineUser && (
                <span style={{ marginLeft: '8px', background: '#059669', color: '#fff', padding: '2px 8px', borderRadius: '999px', fontSize: '0.72rem' }}>
                  🚀 New Online Customer Created!
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#047857', marginTop: '3px' }}>
              Web Receipt Link:{' '}
              <a
                href={getPublicBillUrl(lastCompletedBill.order._id, shopData._id, shopData.pincode)}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#047857', fontWeight: 800, textDecoration: 'underline' }}
              >
                {getPublicBillUrl(lastCompletedBill.order._id, shopData._id, shopData.pincode)}
              </a>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                const msg = buildPosCounterBillWhatsApp(lastCompletedBill.order, shopData, {
                  coinsEarned: lastCompletedBill.coinsEarned,
                  totalCoins: lastCompletedBill.customer?.coins,
                });
                openWhatsAppChat(lastCompletedBill.order.customerPhone, msg);
              }}
              style={{ padding: '8px 12px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}
            >
              📲 Send WhatsApp + Store Link
            </button>
            <button
              type="button"
              onClick={() => setPrintingOrder(lastCompletedBill.order)}
              style={{ padding: '8px 12px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}
            >
              🖨️ Print Thermal Receipt
            </button>
            <button
              type="button"
              onClick={() => setLastCompletedBill(null)}
              style={{ padding: '8px 10px', background: 'transparent', color: '#065f46', border: '1px solid #6ee7b7', borderRadius: '8px', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ⚡ 2. MAIN POS TERMINAL: LEFT = SEARCH & LOOSE ITEMS | RIGHT = LIVE BILL & CUSTOMER CONVERTER */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '16px',
        alignItems: 'start',
      }}>

        {/* LEFT COLUMN: FAST ITEM PICKER + LOOSE ITEM QUICK-ADD */}
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a', fontWeight: 900 }}>
              🔍 1. Scan Barcode or Search Item
            </h3>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>
              Press <kbd style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>F2</kbd> to search
            </span>
          </div>

          {/* Search / Barcode Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const q = searchQuery.trim();
              if (!q) return;
              // If exact barcode typed, run barcode lookup
              if (/^\d{6,14}$/.test(q)) {
                handleBarcodeLookup(q);
                setSearchQuery('');
                return;
              }
              if (searchResults.length > 0) {
                addInventoryItemToBill(searchResults[0]);
                playPosBeep(true);
                setSearchQuery('');
              }
            }}
            style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}
          >
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Scan barcode or type product name (e.g. Atta, Maggi, Amul)…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                padding: '11px 14px',
                borderRadius: '10px',
                border: '2px solid #cbd5e1',
                fontSize: '0.92rem',
                fontWeight: 600,
                outline: 'none',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ padding: '0 12px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontWeight: 800 }}
              >
                ✕
              </button>
            )}
          </form>

          {/* Product Quick-Tap Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: '8px',
            maxHeight: '290px',
            overflowY: 'auto',
            paddingRight: '4px',
            marginBottom: '16px',
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
                    padding: '10px',
                    borderRadius: '10px',
                    border: inBill ? '2px solid #16a34a' : '1px solid #e2e8f0',
                    background: inBill ? '#f0fdf4' : '#f8fafc',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                >
                  {inBill && (
                    <span style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      background: '#16a34a',
                      color: '#fff',
                      fontSize: '0.68rem',
                      fontWeight: 900,
                      padding: '2px 6px',
                      borderRadius: '999px',
                    }}>
                      ×{inBill.qty}
                    </span>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    {p.image ? (
                      <img src={cdnImage(p.image, 60)} alt={p.name} style={{ width: '30px', height: '30px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <span style={{ fontSize: '1.2rem' }}>{p.emoji || '🛒'}</span>
                    )}
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.25, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {p.name}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', fontSize: '0.75rem' }}>
                    <span style={{ color: '#64748b' }}>{p.qnty || '1 unit'}</span>
                    <span style={{ fontWeight: 900, color: '#15803d', fontSize: '0.85rem' }}>
                      ₹{price}
                      {mrp > price && (
                        <span style={{ color: '#94a3b8', textDecoration: 'line-through', fontSize: '0.68rem', marginLeft: '3px' }}>
                          ₹{mrp}
                        </span>
                      )}
                    </span>
                  </div>
                </button>
              );
            })}
            {searchResults.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '18px', color: '#64748b', fontSize: '0.85rem' }}>
                No matching item in inventory. Use the Loose / Custom Item box below to add it in 1 second!
              </div>
            )}
          </div>

          {/* 🌾 LOOSE / UNBARCODED KIRANA ITEM QUICK-ADD */}
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '12px' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 900, color: '#92400e', marginBottom: '8px' }}>
              ⚖️ 2. Loose / Unbarcoded Item Quick-Add (Sugar, Rice, Vegetables, Kirana)
            </div>

            {/* 1-Tap Preset Chips */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
              {LOOSE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setCustomName(preset.name);
                    setCustomQnty(preset.qnty);
                    setTimeout(() => customPriceInputRef.current?.focus(), 40);
                  }}
                  style={{
                    padding: '5px 9px',
                    borderRadius: '999px',
                    border: '1px solid #fcd34d',
                    background: customName === preset.name ? '#f59e0b' : '#ffffff',
                    color: customName === preset.name ? '#ffffff' : '#78350f',
                    fontSize: '0.73rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <form onSubmit={addCustomItemToBill} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '6px' }}>
              <input
                type="text"
                placeholder="Item name (e.g. Loose Sugar 2kg)"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', width: '100%', boxSizing: 'border-box' }}
              />
              <input
                type="text"
                placeholder="Weight/Pack"
                value={customQnty}
                onChange={(e) => setCustomQnty(e.target.value)}
                style={{ padding: '8px 8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', width: '100%', boxSizing: 'border-box' }}
              />
              <input
                ref={customPriceInputRef}
                type="number"
                min="1"
                step="any"
                placeholder="₹ Price"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                style={{ padding: '8px 8px', borderRadius: '8px', border: '2px solid #f59e0b', fontSize: '0.85rem', fontWeight: 800, width: '100%', boxSizing: 'border-box' }}
              />
              <button
                type="submit"
                style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', background: '#d97706', color: '#fff', fontWeight: 900, fontSize: '0.82rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                + Add
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: LIVE BILL + CUSTOMER CONVERTER + CHECKOUT */}
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '16px', border: '2px solid #0f172a', boxShadow: '0 8px 24px rgba(15,23,42,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '12px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a', fontWeight: 900 }}>
                🧾 Live Counter Bill ({billItems.length} items • {totals.totalUnits} units)
              </h3>
            </div>
            {billItems.length > 0 && (
              <button
                type="button"
                onClick={() => setBillItems([])}
                style={{ background: '#fee2e2', color: '#b91c1c', border: 'none', padding: '5px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
              >
                🗑️ Clear Bill
              </button>
            )}
          </div>

          {/* Bill Line Items */}
          {billItems.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b', marginBottom: '14px' }}>
              <div style={{ fontSize: '2rem', marginBottom: '6px' }}>🔫🛍️</div>
              <div style={{ fontWeight: 800, color: '#334155', fontSize: '0.9rem' }}>
                Scan a barcode with your USB gun or tap any product on the left!
              </div>
              <div style={{ fontSize: '0.76rem', marginTop: '4px' }}>
                Items will appear here instantly.
              </div>
            </div>
          ) : (
            <div style={{ maxHeight: '260px', overflowY: 'auto', marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {billItems.map((item, idx) => {
                const lineTotal = Math.round((Number(item.price) || 0) * (Number(item.qty) || 1) * 100) / 100;
                return (
                  <div
                    key={item.rowId || idx}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto auto auto',
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

                    {/* Quantity Stepper */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '2px 4px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setBillItems(prev =>
                            prev
                              .map((it, i) => (i === idx ? { ...it, qty: it.qty - 1 } : it))
                              .filter(it => it.qty > 0)
                          );
                        }}
                        style={{ border: 'none', background: 'transparent', fontWeight: 900, cursor: 'pointer', padding: '2px 6px', color: '#dc2626' }}
                      >
                        −
                      </button>
                      <span style={{ fontWeight: 900, fontSize: '0.82rem', minWidth: '18px', textAlign: 'center' }}>
                        {item.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setBillItems(prev =>
                            prev.map((it, i) => (i === idx ? { ...it, qty: it.qty + 1 } : it))
                          );
                        }}
                        style={{ border: 'none', background: 'transparent', fontWeight: 900, cursor: 'pointer', padding: '2px 6px', color: '#16a34a' }}
                      >
                        +
                      </button>
                    </div>

                    {/* Editable Unit Price */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700 }}>₹</span>
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
                        title="Edit unit selling price for this bill"
                        style={{
                          width: '58px',
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '64px', justifyContent: 'flex-end' }}>
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

          {/* Discount & Round-Off Row */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px', background: '#f8fafc', padding: '8px 10px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569' }}>🏷️ Extra Discount (₹):</span>
            <input
              type="number"
              min="0"
              step="any"
              placeholder="0"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(e.target.value)}
              style={{ width: '75px', padding: '5px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 800, fontSize: '0.82rem' }}
            />
            {totals.subtotal > 10 && totals.subtotal % 10 !== 0 && (
              <button
                type="button"
                onClick={() => {
                  const remainder = Math.round((totals.subtotal % 10) * 100) / 100;
                  setDiscountAmount(String(remainder));
                }}
                style={{
                  padding: '5px 9px',
                  borderRadius: '6px',
                  border: '1px solid #3b82f6',
                  background: '#eff6ff',
                  color: '#1d4ed8',
                  fontSize: '0.73rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                🎯 Round Off (-₹{Math.round((totals.subtotal % 10) * 100) / 100})
              </button>
            )}
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 800 }}>
                Total Saved on MRP: ₹{totals.totalSavings}
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>
                Total: ₹{totals.finalTotal}
              </div>
            </div>
          </div>

          {/* 🌐 WALK-IN CUSTOMER CAPTURE (OFFLINE-TO-ONLINE CONVERTER) */}
          <div style={{
            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
            border: '1.5px solid #60a5fa',
            borderRadius: '12px',
            padding: '12px',
            marginBottom: '12px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#1e3a8a' }}>
                📲 Walk-in Customer WhatsApp (Offline → Online Converter)
              </span>
              {isLookingUpCustomer && (
                <span style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 700 }}>Checking…</span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
              <input
                type="tel"
                maxLength={10}
                placeholder="📞 10-Digit WhatsApp No."
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                style={{
                  padding: '9px 10px',
                  borderRadius: '8px',
                  border: '2px solid #3b82f6',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  background: '#fff',
                }}
              />
              <input
                type="text"
                placeholder="👤 Customer Name (Optional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                style={{
                  padding: '9px 10px',
                  borderRadius: '8px',
                  border: '1px solid #93c5fd',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  background: '#fff',
                }}
              />
            </div>

            {/* Instant Customer CRM Status Badge */}
            {customerLookup && (
              <div style={{ marginTop: '8px', padding: '8px 10px', borderRadius: '8px', background: customerLookup.found ? '#ecfdf5' : '#fef3c7', border: `1px solid ${customerLookup.found ? '#34d399' : '#fcd34d'}`, fontSize: '0.76rem' }}>
                {customerLookup.found ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                    <span style={{ color: '#065f46', fontWeight: 800 }}>
                      ⭐ Returning Customer: <strong>{customerLookup.user.name}</strong> • {customerLookup.pastOrdersCount} past visits (₹{customerLookup.totalSpentAtShop}) • 🪙 {customerLookup.user.coins} Coins
                    </span>
                    {customerLookup.user.coins >= 10 && (
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontWeight: 900, color: '#047857', background: '#fff', padding: '3px 8px', borderRadius: '6px', border: '1px solid #10b981' }}>
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
                    🚀 <strong>First-Time Walk-in!</strong> Sending this bill will auto-create their Online Store Account, lock <strong>{shopData.name}</strong> as their default store, & gift <strong>+{totals.estimatedCoinsEarned} Loyalty Coins</strong>!
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 💳 PAYMENT METHOD + DYNAMIC UPI QR CODE */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
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
                    onClick={() => setPaymentMethod(m.id)}
                    style={{
                      padding: '10px',
                      borderRadius: '10px',
                      border: active ? `2px solid ${m.activeBg}` : '1px solid #cbd5e1',
                      background: active ? m.activeBg : m.bg,
                      color: active ? '#ffffff' : m.fg,
                      fontWeight: 900,
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                    }}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>

            {/* Live Dynamic UPI QR Code for Exact Bill Amount */}
            {paymentMethod === 'UPI' && totals.finalTotal > 0 && (
              <div style={{ marginTop: '10px', padding: '12px', borderRadius: '12px', background: '#f8fafc', border: '1.5px dashed #3b82f6', display: 'flex', alignItems: 'center', gap: '14px' }}>
                {hasShopUpi ? (
                  <>
                    <img
                      src={upiQrImageUrl}
                      alt="UPI QR Code"
                      style={{ width: '110px', height: '110px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff', flexShrink: 0 }}
                    />
                    <div>
                      <div style={{ fontWeight: 900, color: '#1e3a8a', fontSize: '0.92rem' }}>
                        📱 Scan to Pay Exact ₹{totals.finalTotal}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#475569', marginTop: '3px' }}>
                        UPI ID: <strong>{shopData.upiId}</strong>
                      </div>
                      <div style={{ fontSize: '0.73rem', color: '#16a34a', fontWeight: 700, marginTop: '4px' }}>
                        Customer doesn&apos;t need to type the amount — ₹{totals.finalTotal} is pre-filled!
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: '0.8rem', color: '#b45309', fontWeight: 700 }}>
                    ⚠️ Add your Shop UPI ID in ⚙️ Shop Profile (top right) to display a dynamic scan-to-pay UPI QR code here!
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 🚀 CHECKOUT ACTION BUTTONS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              type="button"
              disabled={isSubmitting || billItems.length === 0}
              onClick={() => handleCompleteBill({ sendWhatsApp: true })}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                border: 'none',
                background: billItems.length === 0 ? '#94a3b8' : 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '0.96rem',
                cursor: billItems.length === 0 ? 'not-allowed' : 'pointer',
                boxShadow: billItems.length === 0 ? 'none' : '0 8px 20px rgba(22, 163, 74, 0.32)',
              }}
            >
              {isSubmitting
                ? '⏳ Saving Counter Bill…'
                : `📲 Complete & Send WhatsApp Bill + Online Link (₹${totals.finalTotal})`}
            </button>

            <button
              type="button"
              disabled={isSubmitting || billItems.length === 0}
              onClick={() => handleCompleteBill({ sendWhatsApp: false })}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                background: '#f1f5f9',
                color: '#0f172a',
                fontWeight: 800,
                fontSize: '0.84rem',
                cursor: billItems.length === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              ⚡ Quick Save Cash/UPI Bill (Without WhatsApp)
            </button>
          </div>
        </div>
      </div>

      {/* 📜 3. RECENT COUNTER POS BILLS & ONLINE CONVERSIONS */}
      <div style={{ background: '#ffffff', borderRadius: '16px', padding: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a', fontWeight: 900 }}>
            📜 Recent Walk-in Counter Bills ({posOrders.length})
          </h3>
          <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
            Store Online Link:{' '}
            <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>
              {getShopStorefrontUrl(shopData._id, shopData.pincode)}
            </strong>
          </span>
        </div>

        {posOrders.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '0.86rem' }}>
            No walk-in counter bills yet. Create your first counter bill above!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {posOrders.slice(0, 15).map((po) => {
              const shortId = String(po._id || '').slice(-5).toUpperCase();
              const custName = po.userId?.name || po.customerName || 'Walk-in Customer';
              const custPhone = po.userId?.phone || po.customerPhone || '';
              const itemCount = Array.isArray(po.items) ? po.items.reduce((s, i) => s + (Number(i?.qty) || 1), 0) : 0;
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
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        background: po.paymentMethod === 'UPI' ? '#dbeafe' : po.paymentMethod === 'KHATA' ? '#fef3c7' : '#dcfce7',
                        color: po.paymentMethod === 'UPI' ? '#1e40af' : po.paymentMethod === 'KHATA' ? '#92400e' : '#15803d',
                      }}>
                        {po.paymentMethod || 'CASH'}
                      </span>
                      {po.convertedToOnlineUser && (
                        <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 800, background: '#ecfdf5', color: '#047857', border: '1px solid #6ee7b7' }}>
                          🚀 Converted to Online
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '2px' }}>
                      👤 {custName} {custPhone ? `(${custPhone})` : ''} • {itemCount} units • {new Date(po.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => {
                        const msg = buildPosCounterBillWhatsApp(po, shopData);
                        openWhatsAppChat(custPhone, msg);
                      }}
                      style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #86efac', background: '#f0fdf4', color: '#15803d', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}
                    >
                      📲 WhatsApp Bill + Link
                    </button>
                    <a
                      href={getPublicBillUrl(po._id, shopData._id, shopData.pincode)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#334155', fontWeight: 800, fontSize: '0.75rem', textDecoration: 'none' }}
                    >
                      🌐 Web Bill
                    </a>
                    <button
                      type="button"
                      onClick={() => setPrintingOrder(po)}
                      style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}
                    >
                      🖨️ Print
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 🖨️ THERMAL RECEIPT PRINT MODAL (58mm / 80mm POS Printer Ready) */}
      {printingOrder && (
        <div
          onClick={() => setPrintingOrder(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
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
              borderRadius: '14px',
              padding: '18px',
              fontFamily: 'monospace',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '8px', marginBottom: '8px' }}>
              <div style={{ fontWeight: 900, fontSize: '1.05rem' }}>{shopData.name}</div>
              {shopData.fullAddress && <div style={{ fontSize: '0.75rem' }}>{shopData.fullAddress}</div>}
              <div style={{ fontSize: '0.75rem' }}>Ph: {shopData.phone}</div>
              {shopData.gst && <div style={{ fontSize: '0.72rem' }}>GSTIN: {shopData.gst}</div>}
            </div>

            <div style={{ fontSize: '0.75rem', borderBottom: '1px dashed #000', paddingBottom: '6px', marginBottom: '8px' }}>
              <div>Bill: #{String(printingOrder._id).slice(-5).toUpperCase()} ({printingOrder.paymentMethod})</div>
              <div>Date: {new Date(printingOrder.createdAt).toLocaleString()}</div>
              <div>Customer: {printingOrder.customerName || 'Walk-in'} {printingOrder.customerPhone ? `(${printingOrder.customerPhone})` : ''}</div>
            </div>

            <div style={{ fontSize: '0.76rem', borderBottom: '1px dashed #000', paddingBottom: '8px', marginBottom: '8px' }}>
              {(printingOrder.items || []).map((it, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>{it.qty}x {it.name}</span>
                  <span>₹{Math.round((Number(it.price) || 0) * (Number(it.qty) || 1) * 100) / 100}</span>
                </div>
              ))}
            </div>

            <div style={{ fontSize: '0.82rem', fontWeight: 900, borderBottom: '1px dashed #000', paddingBottom: '8px', marginBottom: '8px' }}>
              {printingOrder.discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                  <span>Discount:</span>
                  <span>-₹{printingOrder.discountAmount}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', marginTop: '4px' }}>
                <span>TOTAL:</span>
                <span>₹{printingOrder.totalAmount}</span>
              </div>
              {printingOrder.savingsAmount > 0 && (
                <div style={{ textAlign: 'center', fontSize: '0.74rem', marginTop: '4px' }}>
                  *** You Saved ₹{printingOrder.savingsAmount} on MRP! ***
                </div>
              )}
            </div>

            <div style={{ textAlign: 'center', fontSize: '0.72rem', marginBottom: '12px' }}>
              <div>Order Online from {shopData.name}:</div>
              <div style={{ wordBreak: 'break-all', fontWeight: 700, marginTop: '2px' }}>
                {getShopStorefrontUrl(shopData._id, shopData.pincode)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => window.print()}
                style={{ flex: 1, padding: '10px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 900, cursor: 'pointer' }}
              >
                🖨️ Print Now
              </button>
              <button
                type="button"
                onClick={() => setPrintingOrder(null)}
                style={{ padding: '10px 14px', background: '#e2e8f0', color: '#0f172a', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

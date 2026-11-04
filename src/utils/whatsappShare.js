// 📲 WhatsApp Digital Bill, Counter POS Receipt & Offline-to-Online Storefront Link Utility (₹0 SMS Cost)

export function toWhatsAppPhone(rawPhone) {
  if (!rawPhone) return '';
  const digits = String(rawPhone).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  return digits.length >= 10 ? digits : '';
}

export function getPublicBillUrl(orderId, shopId = '', pincode = '') {
  if (!orderId) return '';
  const origin = typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : 'https://packitout.app';
  const params = new URLSearchParams();
  if (shopId) params.set('s', String(shopId));
  if (pincode) params.set('pin', String(pincode));
  const qs = params.toString() ? `?${params.toString()}` : '';
  return `${origin}/#/bill/${orderId}${qs}`;
}

export function getShopStorefrontUrl(shopId, pincode = '') {
  if (!shopId) return '';
  const origin = typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : 'https://packitout.app';
  const qs = pincode ? `?pin=${encodeURIComponent(pincode)}` : '';
  return `${origin}/#/s/${shopId}${qs}`;
}

function formatOrderItemsList(items = []) {
  const safe = Array.isArray(items) ? items.filter(Boolean) : [];
  if (safe.length === 0) return '• Custom Parchi Order';
  return safe
    .map((it) => {
      const qty = Number(it.qty) || 1;
      const unitPrice = Number(it.price ?? it.sellingPrice ?? it.mrp ?? 0);
      const unitMrp = Number(it.mrp ?? unitPrice);
      const lineTotal = unitPrice * qty;
      const qntyTag = it.qnty && !it.isCustomNote && it.qnty !== '1 unit' ? ` (${it.qnty})` : '';
      if (it.isCustomNote && unitPrice === 0) {
        return `• ${qty}x ${it.name || 'Special Note'} — Priced at counter`;
      }
      const strikeMrp = unitMrp > unitPrice ? ` ~(MRP ₹${unitMrp * qty})~` : '';
      return `• ${qty}x ${it.name || 'Item'}${qntyTag} — *₹${lineTotal}*${strikeMrp}`;
    })
    .join('\n');
}

function getPaymentSummary(order) {
  const method = String(order?.paymentMethod || '').toUpperCase();
  const isPaid = order?.paymentStatus === 'Paid' || order?.paymentStatus === 'Success';
  if (method === 'KHATA') {
    return '📒 Recorded in Store Khata (Due)';
  }
  if (isPaid) {
    if (method === 'UPI') return '✅ Paid via UPI';
    if (method === 'CASH') return '✅ Paid in Cash';
    return '✅ Paid';
  }
  if (method === 'UPI') {
    return '⏳ UPI Verification Pending';
  }
  return '💵 Pay at Pickup Counter';
}

export function buildPosCounterBillWhatsApp(order, shopData, extra = {}) {
  const orderId = order?._id || '';
  const shortId = String(orderId).slice(-5).toUpperCase() || 'POS';
  const shopId = shopData?._id || order?.shopId?._id || order?.shopId || '';
  const pincode = shopData?.pincode || order?.shopId?.pincode || '';
  const shopName = shopData?.name || order?.shopId?.name || 'Your Local Store';
  const customerName = order?.userId?.name || order?.customerName || extra.customerName || 'Valued Customer';
  const itemsText = formatOrderItemsList(order?.items);
  const itemCount = Array.isArray(order?.items) ? order.items.reduce((s, i) => s + (Number(i?.qty) || 1), 0) : 0;
  const total = Number(order?.totalAmount || 0);
  const savings = Number(order?.savingsAmount ?? extra.savingsAmount ?? 0);
  const discount = Number(order?.discountAmount ?? extra.discountAmount ?? 0);
  const coinsEarned = Number(order?.coinsEarned ?? extra.coinsEarned ?? 0);
  const totalCoins = Number(order?.userId?.coins ?? extra.totalCoins ?? coinsEarned);
  const payLabel = getPaymentSummary(order);
  const billUrl = getPublicBillUrl(orderId, shopId, pincode);
  const storeUrl = getShopStorefrontUrl(shopId, pincode);

  const lines = [
    `🧾 *SMART DIGITAL BILL • #${shortId}*`,
    `🏪 *${shopName}*`,
    ``,
    `Namaste *${customerName}* ji! 🙏`,
    `Thank you for visiting *${shopName}* today. Here is your itemized bill:`,
    ``,
    `🛍️ *Items (${itemCount}):*`,
    itemsText,
    ``,
  ];

  if (discount > 0) {
    lines.push(`🏷️ *Counter Discount: -₹${discount}*`);
  }
  lines.push(`💰 *Total Bill: ₹${total}* (${payLabel})`);

  if (savings > 0) {
    lines.push(`🎉 *Total Saved on MRP Today: ₹${savings}!*`);
  }
  if (coinsEarned > 0) {
    lines.push(`🪙 *Loyalty Reward: +${coinsEarned} Coins Earned!* (Wallet: ${totalCoins} Coins)`);
  }

  if (billUrl) {
    lines.push(
      ``,
      `📄 *View Digital Receipt & 1-Tap Reorder:*`,
      billUrl
    );
  }

  if (storeUrl) {
    lines.push(
      ``,
      `🚀 *Order from ${shopName} Online Next Time!*`,
      `Skip the counter wait — browse our live prices, upload your handwritten parchi, & use your Loyalty Coins from home:`,
      storeUrl
    );
  }

  return lines.join('\n');
}

export function buildShopToCustomerWhatsApp(order, shopData, mode = 'ready') {
  if (order?.orderSource === 'POS' && mode === 'bill') {
    return buildPosCounterBillWhatsApp(order, shopData);
  }
  const orderId = order?._id || '';
  const shortId = String(orderId).slice(-5).toUpperCase();
  const shopId = shopData?._id || order?.shopId?._id || order?.shopId || '';
  const pincode = shopData?.pincode || order?.shopId?.pincode || '';
  const shopName = shopData?.name || order?.shopId?.name || 'Your Local Store';
  const customerName = order?.userId?.name || order?.customerName || 'Customer';
  const itemsText = formatOrderItemsList(order?.items);
  const itemCount = Array.isArray(order?.items) ? order.items.length : 0;
  const total = Number(order?.totalAmount || 0);
  const payLabel = getPaymentSummary(order);
  const billUrl = getPublicBillUrl(orderId, shopId, pincode);

  if (mode === 'ready') {
    return [
      `🛍️ *ORDER READY FOR PICKUP!*`,
      `🏪 *${shopName}*`,
      ``,
      `Namaste *${customerName}* ji! 🙏`,
      `Your Order *#${shortId}* is packed and ready at the counter.`,
      ``,
      `📦 *Items (${itemCount}):*`,
      itemsText,
      ``,
      `💰 *Total Bill: ₹${total}* (${payLabel})`,
      `🔑 *Pickup Token: #${shortId}*`,
      ...(billUrl ? [``, `📄 *View Web Receipt:*`, billUrl] : []),
      ``,
      `_Please show Token #${shortId} at the shop counter to collect your bag!_`,
    ].join('\n');
  }

  return [
    `🧾 *DIGITAL BILL / ORDER RECEIPT*`,
    `🏪 *${shopName}*`,
    ``,
    `👤 Customer: *${customerName}*`,
    `🆔 Order: *#${shortId}* • Status: *${order?.status || 'Active'}*`,
    ``,
    `📦 *Itemized Bill (${itemCount}):*`,
    itemsText,
    ``,
    `💰 *Total Payable: ₹${total}* (${payLabel})`,
    `🔑 *Pickup Token: #${shortId}*`,
    ...(billUrl ? [``, `📄 *View Web Receipt & Reorder Online:*`, billUrl] : []),
    ``,
    `_Thank you for shopping with ${shopName} on PackItOut!_ 🙏`,
  ].join('\n');
}

export function buildCustomerToShopWhatsApp(order, customerUser) {
  const shortId = String(order?._id || '').slice(-5).toUpperCase();
  const shopName = order?.shopId?.name || order?.shopName || 'Store';
  const customerName = customerUser?.name || order?.userId?.name || 'Customer';
  const customerPhone = customerUser?.phone || order?.userId?.phone || '';
  const itemsText = formatOrderItemsList(order?.items);
  const itemCount = Array.isArray(order?.items) ? order.items.length : 0;
  const total = Number(order?.totalAmount || 0);
  const payLabel = getPaymentSummary(order);

  return [
    `🛒 *New PackItOut Order #${shortId}*`,
    `🏪 *${shopName}*`,
    ``,
    `Namaste! I have placed an order on PackItOut:`,
    ``,
    `📦 *Items (${itemCount}):*`,
    itemsText,
    ``,
    `💰 *Total Bill: ₹${total}* (${payLabel})`,
    `👤 Customer: *${customerName}*${customerPhone ? ` (${customerPhone})` : ''}`,
    `🔑 *Pickup Token: #${shortId}*`,
    ``,
    `_Please let me know once my order is packed & ready for pickup!_ 🙏`,
  ].join('\n');
}

export function openWhatsAppChat(rawPhone, messageText) {
  const cleanPhone = toWhatsAppPhone(rawPhone);
  const encoded = encodeURIComponent(messageText || '');
  const url = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

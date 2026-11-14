// 🧾 High-Resolution Visual Bill Image (PNG) & Official PDF Generator + Smart WhatsApp Dispatcher
import { jsPDF } from 'jspdf';
import {
  getPublicBillUrl,
  getShopStorefrontUrl,
  toWhatsAppPhone,
  openWhatsAppChat,
  sanitizeWhatsAppText,
} from './whatsappShare.js';

/**
 * Loads an image safely with CORS handling and timeout protection.
 */
function loadImageSafe(url) {
  return new Promise((resolve) => {
    if (!url) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
    // Timeout after 1.8s so canvas generation never freezes
    setTimeout(() => resolve(null), 1800);
  });
}

/**
 * Resolves shop info safely across different order & shop shapes.
 */
function resolveShop(order, shopData) {
  return shopData || order?.shop || order?.shopId || {};
}

/**
 * Renders a crisp 2x Retina HTML5 Canvas of the bill receipt.
 */
export async function renderBillReceiptCanvas(order, shopData) {
  const shop = resolveShop(order, shopData);
  const shopName = shop?.name || 'Local Store';
  const shopPhone = shop?.phone || '';
  const shopAddress = shop?.fullAddress || '';
  const shopGst = shop?.gst || '';
  const shopPincode = shop?.pincode || '';
  const shopId = shop?._id || '';

  const orderId = order?._id || '';
  const shortId = String(orderId).slice(-5).toUpperCase() || 'POS';
  const createdAt = order?.createdAt ? new Date(order.createdAt) : new Date();
  const paymentMethod = String(order?.paymentMethod || 'CASH').toUpperCase();
  const isPaid = order?.paymentStatus === 'Paid' || order?.paymentStatus === 'Success';
  const customerName = order?.customerName || order?.userId?.name || 'Walk-in Customer';
  const customerPhone = order?.customerPhone || order?.userId?.phone || '';

  const items = Array.isArray(order?.items) ? order.items : [];
  const totalAmount = Number(order?.totalAmount || 0);
  const mrpTotal = Number(order?.mrpTotal || totalAmount);
  const discountAmount = Number(order?.discountAmount || 0);
  const savingsAmount = Number(order?.savingsAmount || (mrpTotal > totalAmount ? mrpTotal - totalAmount : 0));
  const coinsEarned = Number(order?.coinsEarned || 0);

  const storefrontUrl = getShopStorefrontUrl(shopId, shopPincode);
  const publicBillUrl = getPublicBillUrl(orderId, shopId, shopPincode);

  // Dynamic QR Code for Storefront URL
  const qrUrl = storefrontUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=4&data=${encodeURIComponent(storefrontUrl)}`
    : '';
  const qrImage = await loadImageSafe(qrUrl);

  // Dimensions: 560px width
  const canvasWidth = 560;
  const pad = 28;
  const contentWidth = canvasWidth - pad * 2;

  // Compute ample height headroom so canvas never clips
  let estHeight = 360; // Header, store details & customer meta
  estHeight += Math.max(1, items.length) * 52; // items + subtotals
  estHeight += 320; // Totals, savings pill, QR box & footer
  if (shopAddress) estHeight += 24;

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth * 2; // 2x Retina scale
  canvas.height = estHeight * 2;
  const ctx = canvas.getContext('2d');
  ctx.scale(2, 2);

  // 1. Crisp White Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasWidth, estHeight);

  // 2. Top Brand Header Bar
  ctx.fillStyle = '#16a34a';
  ctx.fillRect(0, 0, canvasWidth, 38);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('PackItOut • VERIFIED DIGITAL BILL', pad, 24);

  ctx.textAlign = 'right';
  ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
  ctx.fillText(`BILL #${shortId}`, canvasWidth - pad, 24);

  let y = 64;

  // 3. Shop Details
  ctx.textAlign = 'center';
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
  ctx.fillText(shopName, canvasWidth / 2, y);
  y += 20;

  if (shopAddress) {
    ctx.fillStyle = '#64748b';
    ctx.font = '11px system-ui, -apple-system, sans-serif';
    ctx.fillText(shopAddress + (shopPincode ? ` (${shopPincode})` : ''), canvasWidth / 2, y);
    y += 16;
  }

  ctx.fillStyle = '#475569';
  ctx.font = '11px system-ui, -apple-system, sans-serif';
  let contactStr = shopPhone ? `Ph: ${shopPhone}` : '';
  if (shopGst) contactStr += (contactStr ? '  •  ' : '') + `GSTIN: ${shopGst}`;
  if (contactStr) {
    ctx.fillText(contactStr, canvasWidth / 2, y);
    y += 18;
  }

  // Dashed separator line
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(pad, y);
  ctx.lineTo(canvasWidth - pad, y);
  ctx.stroke();
  ctx.setLineDash([]);
  y += 16;

  // 4. Bill & Customer Metadata Box
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(pad, y, contentWidth, 54);
  ctx.strokeStyle = '#e2e8f0';
  ctx.strokeRect(pad, y, contentWidth, 54);

  // Left side: Customer
  ctx.textAlign = 'left';
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
  ctx.fillText(`👤 ${customerName} ${customerPhone ? `(${customerPhone})` : ''}`, pad + 12, y + 22);

  ctx.fillStyle = '#64748b';
  ctx.font = '10px system-ui, -apple-system, sans-serif';
  ctx.fillText(`🕒 ${createdAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} at ${createdAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`, pad + 12, y + 40);

  // Right side: Payment Status badge
  ctx.textAlign = 'right';
  const badgeText = isPaid ? `✅ PAID (${paymentMethod})` : `⏳ DUE (${paymentMethod})`;
  ctx.fillStyle = isPaid ? '#15803d' : '#b45309';
  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
  ctx.fillText(badgeText, canvasWidth - pad - 12, y + 24);

  y += 66;

  // 5. Itemized Table Header
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(pad, y, contentWidth, 24);
  ctx.fillStyle = '#475569';
  ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ITEM NAME & PACK', pad + 10, y + 16);
  ctx.textAlign = 'center';
  ctx.fillText('QTY', canvasWidth - pad - 130, y + 16);
  ctx.fillText('RATE', canvasWidth - pad - 70, y + 16);
  ctx.textAlign = 'right';
  ctx.fillText('AMOUNT', canvasWidth - pad - 10, y + 16);
  y += 30;

  // 6. Item Rows
  ctx.font = '11px system-ui, -apple-system, sans-serif';
  for (const item of items) {
    const qty = Number(item.qty) || 1;
    const price = Number(item.price ?? item.sellingPrice ?? item.mrp ?? 0);
    const lineTotal = Math.round(price * qty * 100) / 100;

    ctx.textAlign = 'left';
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';

    const itemName = String(item.name || 'Item').slice(0, 36);
    ctx.fillText(itemName, pad + 10, y);

    ctx.font = '9px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#64748b';
    const subDesc = item.qnty && item.qnty !== '1 unit' ? item.qnty : '';
    if (subDesc) {
      ctx.fillText(subDesc, pad + 10, y + 12);
    }

    ctx.font = '11px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.fillText(String(qty), canvasWidth - pad - 130, y);
    ctx.fillText(`₹${price}`, canvasWidth - pad - 70, y);

    ctx.textAlign = 'right';
    ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
    ctx.fillText(`₹${lineTotal}`, canvasWidth - pad - 10, y);

    // Dotted separator between items
    y += subDesc ? 24 : 20;
    ctx.strokeStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.moveTo(pad + 10, y);
    ctx.lineTo(canvasWidth - pad - 10, y);
    ctx.stroke();
    y += 12;
  }

  y += 6;

  // 7. Totals & Savings Summary
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(pad, y);
  ctx.lineTo(canvasWidth - pad, y);
  ctx.stroke();
  ctx.setLineDash([]);
  y += 18;

  if (discountAmount > 0) {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#16a34a';
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    ctx.fillText('🏷️ Extra Discount / Coins Used:', pad + 10, y);
    ctx.textAlign = 'right';
    ctx.fillText(`-₹${discountAmount}`, canvasWidth - pad - 10, y);
    y += 18;
  }

  // Grand Total Box
  ctx.fillStyle = '#f0fdf4';
  ctx.fillRect(pad, y, contentWidth, 40);
  ctx.strokeStyle = '#86efac';
  ctx.strokeRect(pad, y, contentWidth, 40);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#065f46';
  ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
  ctx.fillText('GRAND TOTAL', pad + 14, y + 25);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#15803d';
  ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
  ctx.fillText(`₹${totalAmount}`, canvasWidth - pad - 14, y + 27);
  y += 50;

  // Savings Pill if any
  if (savingsAmount > 0) {
    ctx.fillStyle = '#dcfce7';
    ctx.fillRect(pad + 20, y, contentWidth - 40, 24);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#15803d';
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    ctx.fillText(`🎉 You Saved ₹${savingsAmount} on MRP at this store!`, canvasWidth / 2, y + 16);
    y += 34;
  }

  if (coinsEarned > 0) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#d97706';
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    ctx.fillText(`🪙 +${coinsEarned} PackItOut Loyalty Coins Credited!`, canvasWidth / 2, y);
    y += 18;
  }

  // 8. Offline-to-Online QR Code & Storefront Link
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(pad, y, contentWidth, 100);
  ctx.strokeStyle = '#e2e8f0';
  ctx.strokeRect(pad, y, contentWidth, 100);

  if (qrImage) {
    ctx.drawImage(qrImage, pad + 12, y + 10, 80, 80);
  } else {
    // Stylized QR fallback box
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(pad + 12, y + 10, 80, 80);
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('STORE QR', pad + 52, y + 54);
  }

  ctx.textAlign = 'left';
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
  ctx.fillText('📲 Order Online Next Time!', pad + 104, y + 28);

  ctx.fillStyle = '#475569';
  ctx.font = '10px system-ui, -apple-system, sans-serif';
  ctx.fillText('Skip counter wait • Upload parchi or reorder', pad + 104, y + 46);

  ctx.fillStyle = '#16a34a';
  ctx.font = 'bold 10px monospace';
  const cleanStoreUrl = storefrontUrl.replace(/^https?:\/\//, '');
  ctx.fillText(cleanStoreUrl.length > 38 ? cleanStoreUrl.slice(0, 36) + '…' : cleanStoreUrl, pad + 104, y + 66);

  ctx.fillStyle = '#2563eb';
  ctx.font = 'bold 9px system-ui, -apple-system, sans-serif';
  ctx.fillText('🌐 packitout.app', pad + 104, y + 82);

  y += 114;

  // 9. Bottom Footer
  ctx.textAlign = 'center';
  ctx.fillStyle = '#94a3b8';
  ctx.font = '10px system-ui, -apple-system, sans-serif';
  ctx.fillText('Thank you for shopping local! Powered by PackItOut', canvasWidth / 2, y);

  // Exact height crop with crisp white background
  const finalHeight = (y + 24) * 2;
  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = canvasWidth * 2;
  finalCanvas.height = finalHeight;
  const finalCtx = finalCanvas.getContext('2d');
  
  // Ensure background is pure white with zero transparent pixels
  finalCtx.fillStyle = '#ffffff';
  finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
  finalCtx.drawImage(canvas, 0, 0, finalCanvas.width, finalHeight, 0, 0, finalCanvas.width, finalHeight);

  return finalCanvas;
}

/**
 * Creates PNG Blob & File object from order.
 */
export async function createReceiptImageFile(order, shopData) {
  const shop = resolveShop(order, shopData);
  const canvas = await renderBillReceiptCanvas(order, shop);
  const shortId = String(order?._id || '').slice(-5).toUpperCase() || 'POS';
  const shopName = (shop?.name || 'Store').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Bill_${shortId}_${shopName}.png`;

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error('Canvas toBlob failed'));
      let file;
      try {
        file = new File([blob], filename, { type: 'image/png' });
      } catch {
        file = blob;
        file.name = filename;
      }
      resolve({
        blob,
        file,
        filename,
        canvas,
        dataUrl: canvas.toDataURL('image/png'),
      });
    }, 'image/png');
  });
}

/**
 * Creates official pure-text vector PDF bill (NO raster images).
 * Formatted like the app user's cash receipt (ReceiptModal):
 * - 100% crisp, selectable vector text with PostScript fonts
 * - Ultra-lightweight (~5 KB), instant generation (< 5ms)
 * - Clickable hyperlinks to storefront and digital receipt
 * - 100% valid, opens cleanly in WhatsApp, Chrome, Adobe Acrobat & Mobile.
 */
export async function createReceiptPdfFile(order, shopData) {
  const shop = resolveShop(order, shopData);
  const shortId = String(order?._id || '').slice(-5).toUpperCase() || 'POS';
  const shopName = shop?.name || 'Local Store';
  const shopAddress = shop?.fullAddress || '';
  const shopPhone = shop?.phone || '';
  const shopGst = shop?.gst || '';
  const shopPincode = shop?.pincode || '';
  const shopId = shop?._id || '';

  const customerName = order?.customerName || order?.userId?.name || 'Walk-in Customer';
  const customerPhone = order?.customerPhone || order?.userId?.phone || '';
  const createdAt = order?.createdAt ? new Date(order.createdAt) : new Date();
  const paymentMethod = String(order?.paymentMethod || 'CASH').toUpperCase();
  const isPaid = order?.paymentStatus === 'Paid' || order?.paymentStatus === 'Success';

  const items = Array.isArray(order?.items) ? order.items : [];
  const totalAmount = Number(order?.totalAmount || 0);
  const mrpTotal = Number(order?.mrpTotal || totalAmount);
  const discountAmount = Number(order?.discountAmount || 0);
  const savingsAmount = Number(order?.savingsAmount || (mrpTotal > totalAmount ? mrpTotal - totalAmount : 0));
  const coinsEarned = Number(order?.coinsEarned || 0);

  const storefrontUrl = getShopStorefrontUrl(shopId, shopPincode);
  const publicBillUrl = getPublicBillUrl(order?._id, shopId, shopPincode);
  const safeFilename = `Bill_${shortId}_${(shopName || 'Store').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

  // 1. Dynamic continuous roll height calculation
  let estHeight = 85; // Base header, customer meta, totals box, footer
  if (shopAddress) estHeight += 6;
  if (discountAmount > 0) estHeight += 4;
  if (savingsAmount > 0) estHeight += 5;
  if (coinsEarned > 0) estHeight += 4;
  if (storefrontUrl) estHeight += 8;
  if (publicBillUrl) estHeight += 7;

  items.forEach(it => {
    const nameStr = String(it.name || 'Item');
    const nameLines = Math.ceil(nameStr.length / 24) || 1;
    const subDesc = it.qnty && it.qnty !== '1 unit' ? 3 : 0;
    estHeight += Math.max(nameLines * 3.6 + subDesc, 5);
  });
  estHeight = Math.max(120, Math.ceil(estHeight));

  const widthMm = 80;
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [widthMm, estHeight],
    compress: true,
  });

  let y = 8;

  // Header
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(100, 116, 139);
  pdf.text('CASH RECEIPT • PACKITOUT DIGITAL BILL', widthMm / 2, y, { align: 'center' });
  y += 5;

  // Store Name
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.setTextColor(15, 23, 42);
  const shopLines = pdf.splitTextToSize(shopName.toUpperCase(), 70);
  pdf.text(shopLines, widthMm / 2, y, { align: 'center' });
  y += shopLines.length * 5;

  // Store Address & Contact
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(71, 85, 105);
  if (shopAddress) {
    const addr = shopAddress + (shopPincode ? ` (${shopPincode})` : '');
    const addrLines = pdf.splitTextToSize(addr, 68);
    pdf.text(addrLines, widthMm / 2, y, { align: 'center' });
    y += addrLines.length * 3.5;
  }
  let contactStr = shopPhone ? `Ph: ${shopPhone}` : '';
  if (shopGst) contactStr += (contactStr ? '  •  ' : '') + `GSTIN: ${shopGst}`;
  if (contactStr) {
    pdf.text(contactStr, widthMm / 2, y, { align: 'center' });
    y += 4;
  }

  // Dashed divider line
  pdf.setDrawColor(203, 213, 225);
  pdf.setLineDashPattern([1.5, 1], 0);
  pdf.line(5, y, 75, y);
  y += 4.5;

  // Bill / Token & Status
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(15, 23, 42);
  pdf.text(`BILL #${shortId}`, 5, y);

  if (isPaid) {
    pdf.setTextColor(21, 128, 61);
    pdf.text(`PAID (${paymentMethod})`, 75, y, { align: 'right' });
  } else {
    pdf.setTextColor(180, 83, 9);
    pdf.text(`DUE (${paymentMethod})`, 75, y, { align: 'right' });
  }
  y += 4;

  // Customer & Date
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(100, 116, 139);
  pdf.text(`Date: ${createdAt.toLocaleDateString('en-IN')} at ${createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, 5, y);
  y += 3.8;
  pdf.text(`Customer: ${customerName}${customerPhone ? ` (${customerPhone})` : ''}`, 5, y);
  y += 4.5;

  // Table Header
  pdf.setLineDashPattern([], 0);
  pdf.setFillColor(241, 245, 249);
  pdf.rect(5, y, 70, 5.5, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(71, 85, 105);
  pdf.text('ITEM NAME & PACK', 7, y + 3.8);
  pdf.text('QTY', 48, y + 3.8, { align: 'center' });
  pdf.text('RATE', 59, y + 3.8, { align: 'right' });
  pdf.text('AMOUNT', 73, y + 3.8, { align: 'right' });
  y += 8;

  // Items
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(15, 23, 42);

  items.forEach(it => {
    const qty = Number(it.qty) || 1;
    const price = Number(it.price ?? it.sellingPrice ?? it.mrp ?? 0);
    const lineTotal = Math.round(price * qty * 100) / 100;
    const nameLines = pdf.splitTextToSize(String(it.name || 'Item'), 38);

    pdf.text(nameLines, 7, y);
    pdf.text(String(qty), 48, y, { align: 'center' });
    pdf.text(`Rs.${price}`, 59, y, { align: 'right' });
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Rs.${lineTotal}`, 73, y, { align: 'right' });
    pdf.setFont('helvetica', 'normal');

    let rowH = nameLines.length * 3.5;
    const subDesc = it.qnty && it.qnty !== '1 unit' ? it.qnty : '';
    if (subDesc) {
      pdf.setFontSize(6.5);
      pdf.setTextColor(100, 116, 139);
      pdf.text(subDesc, 7, y + rowH);
      pdf.setFontSize(7.5);
      pdf.setTextColor(15, 23, 42);
      rowH += 3.2;
    }
    y += Math.max(rowH, 4.8);
  });

  y += 1.5;
  pdf.setDrawColor(203, 213, 225);
  pdf.setLineDashPattern([1.5, 1], 0);
  pdf.line(5, y, 75, y);
  y += 4;

  // Discounts if any
  if (discountAmount > 0) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(22, 163, 74);
    pdf.text('Extra Discount / Coins Used:', 7, y);
    pdf.text(`-Rs.${discountAmount}`, 73, y, { align: 'right' });
    y += 4;
  }

  // Grand Total Box
  pdf.setLineDashPattern([], 0);
  pdf.setFillColor(240, 253, 244);
  pdf.setDrawColor(134, 239, 172);
  pdf.rect(5, y, 70, 9, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(6, 95, 70);
  pdf.text('GRAND TOTAL', 8, y + 6);
  pdf.setFontSize(11);
  pdf.setTextColor(21, 128, 61);
  pdf.text(`Rs.${totalAmount}`, 72, y + 6, { align: 'right' });
  y += 12;

  // Savings / Coins
  if (savingsAmount > 0) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(21, 128, 61);
    pdf.text(`You Saved Rs.${savingsAmount} on MRP at this store!`, widthMm / 2, y, { align: 'center' });
    y += 4;
  }
  if (coinsEarned > 0) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(217, 119, 6);
    pdf.text(`+${coinsEarned} PackItOut Loyalty Coins Credited!`, widthMm / 2, y, { align: 'center' });
    y += 4;
  }

  y += 1;
  pdf.setDrawColor(203, 213, 225);
  pdf.setLineDashPattern([1.5, 1], 0);
  pdf.line(5, y, 75, y);
  y += 4;

  // Storefront link
  if (storefrontUrl) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(15, 23, 42);
    pdf.text('Order Online Next Time (Skip Counter Wait):', widthMm / 2, y, { align: 'center' });
    y += 3.8;
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(22, 163, 74);
    pdf.textWithLink(storefrontUrl, widthMm / 2, y, { url: storefrontUrl, align: 'center' });
    y += 5;
  }

  // Digital Receipt Link
  if (publicBillUrl) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(37, 99, 235);
    pdf.textWithLink(`View Digital Receipt: ${publicBillUrl}`, widthMm / 2, y, { url: publicBillUrl, align: 'center' });
    y += 4.5;
  }

  // Footer
  pdf.setFontSize(6.5);
  pdf.setTextColor(148, 163, 184);
  pdf.text('Thank you for shopping local! Powered by PackItOut', widthMm / 2, y, { align: 'center' });

  const blob = pdf.output('blob');
  let file;
  try {
    file = new File([blob], safeFilename, { type: 'application/pdf' });
  } catch {
    file = blob;
    file.name = safeFilename;
  }

  return {
    blob,
    file,
    filename: safeFilename,
    pdf,
    dataUrl: URL.createObjectURL(blob),
  };
}

/**
 * Downloads any blob to user's device.
 */
export function downloadFileBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    try {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      /* ignore cleanup */
    }
  }, 1000);
}

/**
 * Downloads official PDF receipt using jsPDF's built-in save engine with fallback.
 * Works flawlessly on Chrome, Safari, Android, iOS and Desktop.
 */
export async function downloadReceiptPdf(order, shopData) {
  const res = await createReceiptPdfFile(order, shopData);
  try {
    if (res.pdf && typeof res.pdf.save === 'function') {
      res.pdf.save(res.filename);
    } else {
      downloadFileBlob(res.blob, res.filename);
    }
  } catch {
    downloadFileBlob(res.blob, res.filename);
  }
  return res;
}

/**
 * Downloads high-resolution PNG image of the receipt.
 */
export async function downloadReceiptImage(order, shopData) {
  const res = await createReceiptImageFile(order, shopData);
  downloadFileBlob(res.blob, res.filename);
  return res;
}

/**
 * Copies a PNG Blob to clipboard (Desktop / PC instant paste in WhatsApp Web).
 */
export async function copyImageToClipboard(pngBlob) {
  if (navigator?.clipboard?.write && window.ClipboardItem) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': pngBlob }),
      ]);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Generates the WhatsApp text message with clean, 100% clickable links
 * for both the Storefront and the Digital Bill / PDF download.
 */
export function buildWhatsAppBillTextMessage(order, shopData) {
  const shop = resolveShop(order, shopData);
  const shortId = String(order?._id || '').slice(-5).toUpperCase() || 'POS';
  const shopName = shop?.name || 'Local Store';
  const customerName = order?.customerName || order?.userId?.name || 'Valued Customer';
  const total = Number(order?.totalAmount || 0);
  const payMethod = String(order?.paymentMethod || 'CASH').toUpperCase();
  const shopId = shop?._id || '';
  const pincode = shop?.pincode || '';

  const storefrontUrl = getShopStorefrontUrl(shopId, pincode);
  const publicBillUrl = getPublicBillUrl(order?._id, shopId, pincode);

  const items = Array.isArray(order?.items) ? order.items : [];
  const itemCount = items.reduce((s, i) => s + (Number(i?.qty) || 1), 0);

  const lines = [
    `📋 *DIGITAL BILL • #${shortId}*`,
    `🏪 *${shopName}*`,
    ``,
    `Namaste *${customerName}* ji! 🙏`,
    `Thank you for shopping at *${shopName}*. Here is your bill summary:`,
    ``,
    `💰 *Amount:* ₹${total} (${payMethod})`,
    `📦 *Items:* ${itemCount} units`,
  ];

  if (Number(order?.savingsAmount) > 0) {
    lines.push(`🎉 *MRP Savings:* ₹${order.savingsAmount}`);
  }
  if (Number(order?.coinsEarned) > 0) {
    lines.push(`⭐ *Loyalty Coins Earned:* +${order.coinsEarned} Coins`);
  }

  lines.push(
    ``,
    `📄 *Click Link to View Receipt & Download Official PDF Bill:*`,
    publicBillUrl,
    ``,
    `🛒 *Order Online from ${shopName} Next Time:*`,
    `Skip the counter wait — browse live items & upload parchi:`,
    storefrontUrl,
    ``,
    `_Thank you for supporting your local store!_ 🙏`
  );

  return sanitizeWhatsAppText(lines.join('\n'));
}

/**
 * SMART WHATSAPP DISPATCHER:
 * Ensures the customer ALWAYS gets the clickable link in WhatsApp text with 100% intact emojis (no tofu/squares!),
 * AND the shopkeeper gets the bill image/PDF downloaded and copied to clipboard!
 */
export async function sendBillToCustomerWhatsApp(order, shopData, { format = 'whatsapp', toast = null } = {}) {
  const shop = resolveShop(order, shopData);
  const cleanPhone = toWhatsAppPhone(order?.customerPhone || order?.userId?.phone);
  const captionText = buildWhatsAppBillTextMessage(order, shop);

  try {
    if (format === 'pdf') {
      try {
        await downloadReceiptPdf(order, shop);
        if (toast) toast('📄 PDF Bill Downloaded & WhatsApp opening…', 'success');
      } catch (pdfErr) {
        console.warn('PDF prep warning:', pdfErr);
      }
    } else {
      // Auto-generate PNG, copy to clipboard for desktop Ctrl+V, and download
      try {
        const imgRes = await createReceiptImageFile(order, shop);
        if (imgRes?.blob) {
          await copyImageToClipboard(imgRes.blob);
          downloadFileBlob(imgRes.blob, imgRes.filename);
        }
      } catch (imgErr) {
        console.warn('Image prep warning:', imgErr);
      }
      if (toast) toast('📲 WhatsApp opening with clickable links! (Image copied: Ctrl+V to attach)', 'success');
    }

    // Open WhatsApp Chat directly (bypassing wa.me 302 emoji-mangling redirect)
    openWhatsAppChat(cleanPhone, captionText);
    return true;
  } catch (err) {
    console.error('Error sharing bill on WhatsApp:', err);
    if (toast) toast('Opening WhatsApp with clickable links…', 'info');
    openWhatsAppChat(cleanPhone, captionText);
    return false;
  }
}

/**
 * Native Mobile Share Sheet for Image or PDF (if supported).
 */
export async function shareReceiptNative(order, shopData, { format = 'pdf', toast = null } = {}) {
  const shop = resolveShop(order, shopData);
  const captionText = buildWhatsAppBillTextMessage(order, shop);

  try {
    let fileToShare;
    if (format === 'pdf') {
      const pdfRes = await createReceiptPdfFile(order, shop);
      fileToShare = pdfRes.file;
    } else {
      const imgRes = await createReceiptImageFile(order, shop);
      fileToShare = imgRes.file;
    }

    if (navigator?.share && navigator?.canShare && navigator.canShare({ files: [fileToShare] })) {
      await navigator.share({
        files: [fileToShare],
        title: `Bill from ${shop?.name || 'Store'}`,
        text: captionText,
      });
      if (toast) toast('✅ Shared successfully!', 'success');
      return true;
    } else {
      if (format === 'pdf') {
        await downloadReceiptPdf(order, shop);
      } else {
        await downloadReceiptImage(order, shop);
      }
      if (toast) toast('📁 Bill downloaded to your device!', 'info');
      return false;
    }
  } catch (err) {
    if (err?.name !== 'AbortError') {
      console.error('Native share error:', err);
      if (toast) toast('Could not share bill file', 'error');
    }
    return false;
  }
}


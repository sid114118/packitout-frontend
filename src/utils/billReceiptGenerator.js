// 🧾 Client-Side High-Res Bill Receipt Image (PNG) & PDF Generator + Smart WhatsApp Media Dispatcher
import { getPublicBillUrl, getShopStorefrontUrl, toWhatsAppPhone } from './whatsappShare.js';

/**
 * Builds a valid single-page PDF (PDF-1.4) containing a JPEG image scaled to roll width.
 * Standard PDF specification - 100% dependency-free, zero npm bloat.
 */
function buildPdfFromJpeg(jpegBuffer, widthPx, heightPx, widthPt = 226) {
  const heightPt = Math.max(100, Math.round((heightPx / widthPx) * widthPt));
  const parts = [];
  const offsets = [];

  function add(strOrBuf) {
    const buf = Buffer?.isBuffer?.(strOrBuf)
      ? strOrBuf
      : (typeof strOrBuf === 'string' ? new TextEncoder().encode(strOrBuf) : new Uint8Array(strOrBuf));
    offsets.push(parts.reduce((a, b) => a + b.length, 0));
    parts.push(buf);
  }

  const header = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  parts.push(new TextEncoder().encode(header));

  // Obj 1: Catalog
  add('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  // Obj 2: Pages
  add('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');

  // Obj 3: Page (MediaBox matches the exact height of the receipt)
  add(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${widthPt} ${heightPt}] /Resources << /XObject << /Im1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`);

  // Obj 4: Image XObject (JPEG DCTDecode)
  const imgHeader = `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${widthPx} /Height ${heightPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBuffer.length} >>\nstream\n`;
  const imgFooter = '\nendstream\nendobj\n';
  offsets.push(parts.reduce((a, b) => a + b.length, 0));
  
  const headerBuf = new TextEncoder().encode(imgHeader);
  const footerBuf = new TextEncoder().encode(imgFooter);
  const fullImgBuf = new Uint8Array(headerBuf.length + jpegBuffer.length + footerBuf.length);
  fullImgBuf.set(headerBuf, 0);
  fullImgBuf.set(jpegBuffer, headerBuf.length);
  fullImgBuf.set(footerBuf, headerBuf.length + jpegBuffer.length);
  parts.push(fullImgBuf);

  // Obj 5: Page Content stream
  const content = `q\n${widthPt} 0 0 ${heightPt} 0 0 cm\n/Im1 Do\nQ\n`;
  add(`5 0 obj\n<< /Length ${content.length} >>\nstream\n${content}endstream\nendobj\n`);

  // XRef Table & Trailer
  const startXref = parts.reduce((a, b) => a + b.length, 0);
  let xref = 'xref\n0 6\n0000000000 65535 f \n';
  for (let i = 0; i < 5; i++) {
    xref += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
  }
  xref += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;
  parts.push(new TextEncoder().encode(xref));

  const totalLength = parts.reduce((a, b) => a + b.length, 0);
  const result = new Uint8Array(totalLength);
  let pos = 0;
  for (const part of parts) {
    result.set(part, pos);
    pos += part.length;
  }
  return result;
}

/**
 * Loads an image safely without throwing.
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
 * Helper to wrap text into multiple lines for canvas.
 */
function wrapCanvasText(ctx, text, maxWidth) {
  const words = String(text || '').split(/\s+/);
  const lines = [];
  let currentLine = words[0] || '';

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

/**
 * Renders a crisp 2x Retina HTML5 Canvas of the bill receipt.
 */
export async function renderBillReceiptCanvas(order, shopData) {
  const shopName = shopData?.name || order?.shopId?.name || 'Local Store';
  const shopPhone = shopData?.phone || order?.shopId?.phone || '';
  const shopAddress = shopData?.fullAddress || order?.shopId?.fullAddress || '';
  const shopGst = shopData?.gst || order?.shopId?.gst || '';
  const shopPincode = shopData?.pincode || order?.shopId?.pincode || '';
  const shopId = shopData?._id || order?.shopId?._id || order?.shopId || '';

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
    ? `https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=4&data=${encodeURIComponent(storefrontUrl)}`
    : '';
  const qrImage = await loadImageSafe(qrUrl);

  // Dimensions
  const canvasWidth = 560; // 560px crisp width
  const pad = 28;
  const contentWidth = canvasWidth - pad * 2;

  // Approximate height calculation
  let estHeight = 280; // Header & meta
  estHeight += Math.max(1, items.length) * 44; // items
  estHeight += 240; // Totals, savings, QR code & footer
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
    const mrp = Number(item.mrp ?? price);

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

  // Crop canvas to actual rendered content
  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = canvasWidth * 2;
  finalCanvas.height = (y + 20) * 2;
  const finalCtx = finalCanvas.getContext('2d');
  finalCtx.drawImage(canvas, 0, 0, finalCanvas.width, finalCanvas.height, 0, 0, finalCanvas.width, finalCanvas.height);

  return finalCanvas;
}

/**
 * Creates PNG Blob & File object from order.
 */
export async function createReceiptImageFile(order, shopData) {
  const canvas = await renderBillReceiptCanvas(order, shopData);
  const shortId = String(order?._id || '').slice(-5).toUpperCase() || 'POS';
  const shopName = (shopData?.name || 'Store').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Bill_${shortId}_${shopName}.png`;

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error('Canvas toBlob failed'));
      const file = new File([blob], filename, { type: 'image/png' });
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
 * Creates PDF Blob & File object from order.
 */
export async function createReceiptPdfFile(order, shopData) {
  const canvas = await renderBillReceiptCanvas(order, shopData);
  const shortId = String(order?._id || '').slice(-5).toUpperCase() || 'POS';
  const shopName = (shopData?.name || 'Store').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Bill_${shortId}_${shopName}.pdf`;

  // Convert canvas to JPEG for standard PDF compression
  const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.95);
  const base64Data = jpegDataUrl.split(',')[1];
  const binaryString = atob(base64Data);
  const jpegBytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    jpegBytes[i] = binaryString.charCodeAt(i);
  }

  const pdfBytes = buildPdfFromJpeg(jpegBytes, canvas.width, canvas.height, 226);
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const file = new File([blob], filename, { type: 'application/pdf' });

  return {
    blob,
    file,
    filename,
    dataUrl: URL.createObjectURL(blob),
  };
}

/**
 * Downloads any blob to user device.
 */
export function downloadFileBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
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
 * SMART WHATSAPP DISPATCHER:
 * Sends the Bill as an Image (or PDF) to Customer with PackItOut online store link.
 * 
 * Flow:
 * - On Mobile / Tablet: Uses navigator.share({ files: [imageFile], text: captionWithPackItOutLink })
 *   Attaches the actual receipt image directly in WhatsApp!
 * - On PC / Desktop:
 *   1. Copies the Receipt Image directly to clipboard (for instant Ctrl+V paste in WhatsApp Web)
 *   2. Downloads the receipt file to device
 *   3. Opens WhatsApp chat with customer with caption & PackItOut links prefilled!
 */
export async function sendBillToCustomerWhatsApp(order, shopData, { format = 'image', toast = null } = {}) {
  const cleanPhone = toWhatsAppPhone(order?.customerPhone || order?.userId?.phone);
  const shortId = String(order?._id || '').slice(-5).toUpperCase() || 'POS';
  const shopName = shopData?.name || order?.shopId?.name || 'Local Store';
  const customerName = order?.customerName || order?.userId?.name || 'Valued Customer';
  const total = Number(order?.totalAmount || 0);
  const payMethod = String(order?.paymentMethod || 'CASH').toUpperCase();
  const shopId = shopData?._id || order?.shopId?._id || order?.shopId || '';
  const pincode = shopData?.pincode || order?.shopId?.pincode || '';

  const storefrontUrl = getShopStorefrontUrl(shopId, pincode);
  const publicBillUrl = getPublicBillUrl(order?._id, shopId, pincode);

  // Caption message containing PackItOut store link + web receipt link
  const captionText = [
    `🧾 *DIGITAL BILL • #${shortId}*`,
    `🏪 *${shopName}*`,
    ``,
    `Namaste *${customerName}* ji! 🙏`,
    `Here is your bill for *₹${total}* (${payMethod}).`,
    ``,
    `🛍️ *Order Online from ${shopName} on PackItOut:*`,
    `👉 ${storefrontUrl}`,
    ``,
    `🌐 *View Digital Receipt:*`,
    `👉 ${publicBillUrl}`,
    ``,
    `_Thank you for shopping local with ${shopName}!_ 🙏`,
  ].join('\n');

  try {
    // 1. Generate the receipt file
    let fileToShare = null;
    let pngBlob = null;

    if (format === 'pdf') {
      const pdfRes = await createReceiptPdfFile(order, shopData);
      fileToShare = pdfRes.file;
    } else {
      const imgRes = await createReceiptImageFile(order, shopData);
      fileToShare = imgRes.file;
      pngBlob = imgRes.blob;
    }

    // 2. Check if Native Web Share API supports file sharing (Mobile Android / iOS / Tablets)
    const canNativeShare = Boolean(
      navigator?.share &&
      navigator?.canShare &&
      navigator.canShare({ files: [fileToShare] })
    );

    if (canNativeShare) {
      if (toast) toast('📱 Attaching Bill Image to WhatsApp…', 'info');
      await navigator.share({
        files: [fileToShare],
        title: `Bill #${shortId} - ${shopName}`,
        text: captionText,
      });
      if (toast) toast('✅ Bill sent on WhatsApp!', 'success');
      return true;
    }

    // 3. Desktop / Laptop / WhatsApp Web Fallback:
    // Auto-copy image to clipboard so shopkeeper can just press Ctrl+V in WhatsApp Web!
    let copied = false;
    if (pngBlob) {
      copied = await copyImageToClipboard(pngBlob);
    }

    // Auto-download as backup
    downloadFileBlob(fileToShare, fileToShare.name);

    if (toast) {
      if (copied) {
        toast('📋 Bill Image copied to clipboard! Just press Ctrl+V in WhatsApp Web to paste it!', 'success');
      } else {
        toast('📁 Bill downloaded! Attach it in WhatsApp chat.', 'info');
      }
    }

    // Open WhatsApp Web with pre-filled caption & PackItOut link
    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(captionText)}`
      : `https://wa.me/?text=${encodeURIComponent(captionText)}`;
    
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    return true;
  } catch (err) {
    console.error('Error sharing bill on WhatsApp:', err);
    if (toast) toast('Could not attach file, opening WhatsApp text…', 'error');
    // Fallback to text link if media generation fails
    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(captionText)}`
      : `https://wa.me/?text=${encodeURIComponent(captionText)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    return false;
  }
}

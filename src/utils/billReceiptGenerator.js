// 🧾 Pure Vector-Text Official PDF Bill Generator & WhatsApp Dispatcher
import { jsPDF } from 'jspdf';
import {
  getPublicBillUrl,
  getShopStorefrontUrl,
  toWhatsAppPhone,
  openWhatsAppChat,
  sanitizeWhatsAppText,
  isMobileDevice,
} from './whatsappShare.js';

/**
 * Resolves shop info safely across different order & shop shapes.
 */
function resolveShop(order, shopData) {
  return shopData || order?.shop || order?.shopId || {};
}

const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

export const KHATA_LAUNCH_DATE = new Date('2026-11-01T00:00:00.000Z');

/**
 * Enforces mathematically continuous chronological running balance across a list of transactions.
 * Filters out pre-November legacy test records, rejected transactions, and zero-balance artifacts.
 */
export function enrichTransactionsWithRunningBalance(transactions = []) {
  const valid = (Array.isArray(transactions) ? transactions : []).filter((t) => {
    if (!t || t.verificationStatus === 'Rejected') return false;
    if (t.createdAt && new Date(t.createdAt) < KHATA_LAUNCH_DATE) return false;
    if (Number(t.balanceBefore) === 0 && Number(t.balanceAfter) === 0 && (!t.amount || Number(t.amount) === 0)) return false;
    return true;
  });

  // Sort chronological (oldest to newest) to trace true running balance
  const sorted = [...valid].sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));

  let runningBal = 0;
  let totalCredit = 0;
  let totalSettled = 0;

  const enriched = sorted.map((tx) => {
    const isCredit = tx.type === 'CREDIT_BILL' || tx.type === 'MANUAL_CREDIT';
    const amt = r2(tx.amount);
    const bBefore = runningBal;
    if (isCredit) {
      runningBal = r2(runningBal + amt);
      totalCredit = r2(totalCredit + amt);
    } else if (tx.verificationStatus !== 'PendingVerification') {
      runningBal = Math.max(0, r2(runningBal - amt));
      totalSettled = r2(totalSettled + amt);
    }
    return {
      ...tx,
      computedBalanceBefore: bBefore,
      computedBalanceAfter: runningBal,
    };
  });

  return {
    transactions: enriched,
    totalCredit,
    totalSettled,
    netPending: runningBal,
  };
}

/**
 * Classifies an order into one of the explicit Khata scenarios so PDFs,
 * Web Bills, Thermal Printouts, Order Cards, and Receipts render uniformly.
 * Scenarios:
 *   - 'FIRST_KHATA': First-time Khata entry opened with this bill (full or split)
 *   - 'REPEAT_KHATA': Repeat Khata entry added to existing Khata account (full or split)
 *   - 'PAID_WITH_OLD_KHATA': Today's bill paid in full (Cash/UPI) while customer has older pending Khata
 *   - 'NORMAL': Standard Cash/UPI/POP bill with Rs.0 Khata
 */
export function extractKhataMeta(order) {
  if (!order) {
    return {
      scenario: 'NORMAL',
      isKhataBill: false,
      isFirstKhata: false,
      isSplit: false,
      previousDue: 0,
      paidNow: 0,
      paidVia: 'NONE',
      addedDue: 0,
      newTotalDue: 0,
      settledAmount: 0,
      isSettled: true,
    };
  }

  const snap = order.khataSnapshot || {};
  const method = String(order.paymentMethod || '').toUpperCase();
  const totalAmount = r2(order.totalAmount);

  const addedDue = snap.addedDue !== undefined
    ? r2(snap.addedDue)
    : (Number(order.khataAmount) > 0 ? r2(order.khataAmount) : (method === 'KHATA' ? totalAmount : 0));

  const paidNow = snap.paidNow !== undefined
    ? r2(snap.paidNow)
    : (Number(order.paidAmount) > 0 ? r2(order.paidAmount) : (addedDue > 0 ? Math.max(0, r2(totalAmount - addedDue)) : totalAmount));

  const paidVia = snap.paidVia || order.paidVia || (paidNow > 0 ? (method === 'UPI' ? 'UPI' : 'CASH') : 'NONE');
  const previousDue = r2(snap.previousDue || 0);
  const newTotalDue = snap.newTotalDue !== undefined
    ? r2(snap.newTotalDue)
    : r2(previousDue + addedDue);

  const isFirstKhata = addedDue > 0 && Boolean(snap.isFirstKhata);
  const isKhataBill = addedDue > 0 || method === 'KHATA';
  const isSplit = addedDue > 0 && paidNow > 0;
  const settledAmount = r2(order.khataSettledAmount || 0);
  const isSettled = order.paymentStatus === 'Paid' || order.paymentStatus === 'Success';

  let scenario = 'NORMAL';
  if (addedDue > 0) {
    scenario = isFirstKhata ? 'FIRST_KHATA' : 'REPEAT_KHATA';
  } else if (previousDue > 0) {
    scenario = 'PAID_WITH_OLD_KHATA';
  }

  return {
    scenario,
    isKhataBill,
    isFirstKhata,
    isFirstTimeKhata: isFirstKhata,
    isSplit,
    previousDue,
    previousBalance: previousDue,
    paidNow,
    paidVia,
    addedDue,
    addedToKhata: addedDue,
    newTotalDue,
    netKhataPayable: newTotalDue,
    settledAmount,
    isSettled,
  };
}

/**
 * Creates official pure-text vector PDF bill (NO raster images).
 * Supports all Cash, UPI, First-Time Khata, Repeat Khata, Split Payment,
 * and Paid-With-Old-Khata Reminder scenarios.
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
  const khata = extractKhataMeta(order);

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
  let estHeight = 88; // Base header, customer meta, totals box, footer
  if (shopAddress) estHeight += 6;
  if (discountAmount > 0) estHeight += 4;
  if (savingsAmount > 0) estHeight += 5;
  if (coinsEarned > 0) estHeight += 4;
  if (khata.scenario === 'FIRST_KHATA' || khata.scenario === 'REPEAT_KHATA') estHeight += 36;
  else if (khata.scenario === 'PAID_WITH_OLD_KHATA') estHeight += 18;
  if (storefrontUrl) estHeight += 8;
  if (publicBillUrl) estHeight += 7;

  items.forEach(it => {
    const nameStr = String(it.name || 'Item');
    const nameLines = Math.ceil(nameStr.length / 24) || 1;
    const subDesc = it.qnty && it.qnty !== '1 unit' ? 3 : 0;
    estHeight += Math.max(nameLines * 3.6 + subDesc, 5);
  });
  estHeight = Math.max(125, Math.ceil(estHeight));

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
  const subtitle = khata.addedDue > 0
    ? 'STORE KHATA RECEIPT - PACKITOUT DIGITAL BILL'
    : 'CASH RECEIPT - PACKITOUT DIGITAL BILL';
  pdf.text(subtitle, widthMm / 2, y, { align: 'center' });
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
  if (shopGst) contactStr += (contactStr ? '  |  ' : '') + `GSTIN: ${shopGst}`;
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
  pdf.setFontSize(8.2);
  pdf.setTextColor(15, 23, 42);
  pdf.text(`BILL #${shortId}`, 5, y);

  if (khata.addedDue > 0) {
    if (isPaid) {
      pdf.setTextColor(21, 128, 61);
      pdf.text('KHATA SETTLED (PAID)', 75, y, { align: 'right' });
    } else if (khata.isSplit) {
      pdf.setTextColor(180, 83, 9);
      pdf.text(`SPLIT: PAID Rs.${khata.paidNow} + KHATA`, 75, y, { align: 'right' });
    } else if (khata.isFirstKhata) {
      pdf.setTextColor(180, 83, 9);
      pdf.text('FIRST KHATA DUE', 75, y, { align: 'right' });
    } else {
      pdf.setTextColor(180, 83, 9);
      pdf.text('KHATA DUE', 75, y, { align: 'right' });
    }
  } else if (isPaid) {
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
  if (khata.addedDue > 0 && !isPaid) {
    pdf.setFillColor(255, 251, 235);
    pdf.setDrawColor(252, 211, 77);
  } else {
    pdf.setFillColor(240, 253, 244);
    pdf.setDrawColor(134, 239, 172);
  }
  pdf.rect(5, y, 70, 9, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(khata.addedDue > 0 && !isPaid ? 146 : 6, khata.addedDue > 0 && !isPaid ? 64 : 95, khata.addedDue > 0 && !isPaid ? 14 : 70);
  pdf.text('BILL TOTAL', 8, y + 6);
  pdf.setFontSize(11);
  pdf.text(`Rs.${totalAmount}`, 72, y + 6, { align: 'right' });
  y += 11.5;

  // 📒 KHATA ACCOUNT SUMMARY BOX (All 3 Khata-related Scenarios)
  if (khata.scenario === 'FIRST_KHATA' || khata.scenario === 'REPEAT_KHATA') {
    const boxRows = [];
    boxRows.push({ label: 'Account Holder:', value: `${customerName}${customerPhone ? ` (${customerPhone})` : ''}`, bold: false });
    boxRows.push({ label: 'Previous Khata Balance:', value: `Rs.${khata.previousDue}`, bold: false });
    if (khata.paidNow > 0) {
      boxRows.push({ label: `Paid Now (${khata.paidVia}):`, value: `-Rs.${khata.paidNow}`, bold: false, green: true });
    }
    boxRows.push({ label: 'Added to Khata Today:', value: `+Rs.${khata.addedDue}`, bold: true });

    const boxHeight = 14 + boxRows.length * 4 + (isPaid ? 5 : 4.5);
    pdf.setFillColor(254, 243, 199);
    pdf.setDrawColor(217, 119, 6);
    pdf.rect(5, y, 70, boxHeight, 'FD');

    let ky = y + 4.2;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(146, 64, 14);
    const boxTitle = khata.isFirstKhata
      ? 'NEW KHATA ACCOUNT OPENED (FIRST ENTRY)'
      : 'STORE KHATA LEDGER SUMMARY';
    pdf.text(boxTitle, widthMm / 2, ky, { align: 'center' });
    ky += 4.2;

    pdf.setFontSize(7);
    for (const r of boxRows) {
      pdf.setFont('helvetica', r.bold ? 'bold' : 'normal');
      if (r.green) pdf.setTextColor(21, 128, 61);
      else pdf.setTextColor(120, 53, 15);
      pdf.text(r.label, 7.5, ky);
      pdf.text(String(r.value).slice(0, 28), 72.5, ky, { align: 'right' });
      ky += 3.9;
    }

    pdf.setDrawColor(217, 119, 6);
    pdf.line(7.5, ky - 1.2, 72.5, ky - 1.2);
    ky += 2.6;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.2);
    pdf.setTextColor(153, 27, 27);
    pdf.text('NET TOTAL KHATA PAYABLE:', 7.5, ky);
    pdf.text(`Rs.${khata.newTotalDue}`, 72.5, ky, { align: 'right' });
    ky += 3.8;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.2);
    if (isPaid) {
      pdf.setTextColor(21, 128, 61);
      pdf.text('STATUS: THIS BILL HAS BEEN SETTLED LATER IN KHATA BOOK', widthMm / 2, ky, { align: 'center' });
    } else {
      pdf.setTextColor(120, 53, 15);
      pdf.text('Recorded in Store Digital Khata. Pay anytime at counter or UPI.', widthMm / 2, ky, { align: 'center' });
    }

    y += boxHeight + 3;
  } else if (khata.scenario === 'PAID_WITH_OLD_KHATA') {
    const boxHeight = 14.5;
    pdf.setFillColor(239, 246, 255);
    pdf.setDrawColor(59, 130, 246);
    pdf.rect(5, y, 70, boxHeight, 'FD');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.2);
    pdf.setTextColor(30, 64, 175);
    pdf.text('PENDING STORE KHATA REMINDER', widthMm / 2, y + 4.2, { align: 'center' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.8);
    pdf.text(`Today's Bill #${shortId}: PAID IN FULL (${paymentMethod})`, 7.5, y + 8.3);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Previous Unpaid Khata Balance:', 7.5, y + 12.2);
    pdf.text(`Rs.${khata.previousDue}`, 72.5, y + 12.2, { align: 'right' });

    y += boxHeight + 3;
  }

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
 * Downloads official pure-text PDF receipt using jsPDF's built-in save engine with fallback.
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
 * Shared PDF WhatsApp Dispatcher:
 * - Directly opens WhatsApp chat for target phone number with pre-filled bill + 1-tap PDF link
 * - Never forces an unwanted file download dialog when the user intends to message WhatsApp!
 */
async function dispatchPdfViaWhatsApp({ pdfRes, cleanPhone, shareTitle, captionText, toast, docLabel = 'PDF', targetWindow = null }) {
  // When customer's phone number is known, open WhatsApp directly inside cleanPhone's chat
  // with pre-filled bill details + 1-tap auto-PDF download link!
  if (cleanPhone) {
    if (toast) toast(`📲 Opening +${cleanPhone} on WhatsApp!`, 'success');
    openWhatsAppChat(cleanPhone, captionText, targetWindow);
    return true;
  }

  // Only when NO customer phone number is provided, try mobile Web Share sheet
  if (isMobileDevice() && navigator?.share && navigator?.canShare && pdfRes?.file) {
    try {
      if (navigator.canShare({ files: [pdfRes.file] })) {
        await navigator.share({
          files: [pdfRes.file],
          title: shareTitle,
          text: captionText,
        });
        if (toast) toast(`✅ ${docLabel} shared via WhatsApp!`, 'success');
        return true;
      }
    } catch (shareErr) {
      if (shareErr?.name === 'AbortError') return false;
      console.warn('Native file share failed, falling back:', shareErr);
    }
  }

  if (toast) toast(`📲 Opening WhatsApp…`, 'info');
  openWhatsAppChat('', captionText, targetWindow);
  return true;
}

/**
 * Generates the clean WhatsApp PDF bill text message
 * covering normal bills, First-Time Khata, Repeat/Split Khata, and Old Khata Reminders.
 */
export function buildWhatsAppBillTextMessage(order, shopData) {
  const shop = resolveShop(order, shopData);
  const shortId = String(order?._id || '').slice(-5).toUpperCase() || 'POS';
  const shopName = shop?.name || 'Local Store';
  const customerName = order?.customerName || order?.userId?.name || 'Customer';
  const total = Number(order?.totalAmount || 0);
  const payMethod = String(order?.paymentMethod || 'CASH').toUpperCase();
  const shopId = shop?._id || '';
  const pincode = shop?.pincode || '';
  const khata = extractKhataMeta(order);

  const pdfBillUrl = getPublicBillUrl(order?._id, shopId, pincode, { autoPdf: true });

  let payStatus = `Paid (${payMethod})`;
  if (khata.isKhataBill) {
    if (khata.isSettled) payStatus = `Khata Settled ✅`;
    else if (khata.isSplit) payStatus = `Paid ₹${khata.paidNow} ${khata.paidVia} + ₹${khata.addedDue} Khata Due`;
    else payStatus = `Khata Due`;
  }

  const lines = [
    `📄 *OFFICIAL PDF BILL • #${shortId}*`,
    `🏪 *${shopName}*`,
    ``,
    `👤 Customer: *${customerName}*`,
    `💰 *Bill Total:* ₹${total} (${payStatus})`,
  ];

  if (khata.scenario === 'FIRST_KHATA') {
    lines.push(
      ``,
      `📒 *Khata Account Opened (First Bill)*`,
      `• Previous Khata: ₹0`,
      ...(khata.paidNow > 0 ? [`• Paid Now (${khata.paidVia}): ₹${khata.paidNow}`] : []),
      `• Added to Khata Today: +₹${khata.addedDue}`,
      `• *Total Net Khata Due: ₹${khata.newTotalDue}*`
    );
  } else if (khata.scenario === 'REPEAT_KHATA') {
    lines.push(
      ``,
      `📒 *Khata Ledger Update*`,
      `• Previous Khata: ₹${khata.previousDue}`,
      ...(khata.paidNow > 0 ? [`• Paid Now (${khata.paidVia}): ₹${khata.paidNow}`] : []),
      `• Added to Khata Today: +₹${khata.addedDue}`,
      `• *Total Net Khata Due: ₹${khata.newTotalDue}*`
    );
  } else if (khata.scenario === 'PAID_WITH_OLD_KHATA') {
    lines.push(
      ``,
      `ℹ️ *Previous Khata Balance:* ₹${khata.previousDue} pending at store.`
    );
  }

  lines.push(
    ``,
    `📥 *Download / View Official PDF Bill:*`,
    pdfBillUrl,
    ``,
    `_Thank you for shopping at ${shopName}!_ 🙏`
  );

  return sanitizeWhatsAppText(lines.join('\n'));
}

/**
 * SMART PDF-ONLY WHATSAPP DISPATCHER:
 * 1. Directly opens WhatsApp chat with target customer phone number and official PDF bill link.
 * 2. On Mobile when phone is unknown: uses Web Share Sheet with attached vector PDF file.
 */
export async function sendBillToCustomerWhatsApp(order, shopData, { toast = null, targetWindow = null } = {}) {
  const shop = resolveShop(order, shopData);
  const cleanPhone = toWhatsAppPhone(order?.customerPhone || order?.userId?.phone);
  const captionText = buildWhatsAppBillTextMessage(order, shop);
  const shortId = String(order?._id || '').slice(-5).toUpperCase() || 'POS';

  // If customer's phone number is known, immediately open WhatsApp directly with their number and PDF bill
  if (cleanPhone) {
    if (toast) toast(`📲 Opening +${cleanPhone} on WhatsApp!`, 'success');
    openWhatsAppChat(cleanPhone, captionText, targetWindow);
    return true;
  }

  try {
    const pdfRes = await createReceiptPdfFile(order, shop);
    return await dispatchPdfViaWhatsApp({
      pdfRes,
      cleanPhone,
      shareTitle: `Bill #${shortId} from ${shop?.name || 'Store'}`,
      captionText,
      toast,
      docLabel: 'PDF Bill',
      targetWindow,
    });
  } catch (err) {
    console.error('Error sharing PDF bill on WhatsApp:', err);
    if (toast) toast('Opening WhatsApp…', 'info');
    openWhatsAppChat(cleanPhone, captionText, targetWindow);
    return false;
  }
}

/**
 * Native Mobile Share Sheet for PDF (backward-compatible alias).
 */
export async function shareReceiptNative(order, shopData, { toast = null } = {}) {
  return sendBillToCustomerWhatsApp(order, shopData, { toast });
}

/**
 * Creates a pure vector-text Store Khata Statement OR Payment Receipt ("Jama Parchi") PDF.
 * Zero raster images, 100% selectable text, Rs. formatting.
 */
export async function createKhataStatementPdfFile(account, transactions = [], shopData = {}, options = {}) {
  const shop = shopData || account?.shopId || {};
  const shopName = shop?.name || 'Local Store';
  const shopAddress = shop?.fullAddress || '';
  const shopPhone = shop?.phone || '';
  const shopGst = shop?.gst || '';
  const shopPincode = shop?.pincode || '';
  const shopId = shop?._id || '';

  const custName = account?.customerName || account?.userId?.name || 'Customer';
  const custPhone = account?.customerPhone || '';
  const paymentTx = options?.paymentTx || null;

  // Enrich transactions with mathematically continuous chronological running balance
  const enrichedLedger = enrichTransactionsWithRunningBalance(transactions);

  // Use reconciled ledger numbers if transactions exist, else fallback to account doc
  const totalCredit = enrichedLedger.transactions.length > 0 ? enrichedLedger.totalCredit : r2(account?.totalCreditGiven);
  const totalSettled = enrichedLedger.transactions.length > 0 ? enrichedLedger.totalSettled : r2(account?.totalSettled);
  const currentBal = enrichedLedger.transactions.length > 0 ? enrichedLedger.netPending : r2(account?.currentBalance);

  // Take the most recent 28 transactions for receipt printing (chronological order)
  const confirmedTxns = enrichedLedger.transactions.slice(-28);

  // If this is a Jama receipt (paymentTx), find its enriched running balance
  let effectivePaymentTx = paymentTx;
  if (paymentTx) {
    const found = enrichedLedger.transactions.find((t) => String(t._id || '') === String(paymentTx._id || ''));
    if (found) {
      effectivePaymentTx = {
        ...paymentTx,
        balanceBefore: found.computedBalanceBefore,
        balanceAfter: found.computedBalanceAfter,
      };
    }
  }

  const storefrontUrl = getShopStorefrontUrl(shopId, shopPincode);
  const cleanNameTag = (custName || 'Customer').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 18);
  const safeFilename = effectivePaymentTx
    ? `Khata_Receipt_${cleanNameTag}_${Date.now().toString().slice(-4)}.pdf`
    : `Khata_Statement_${cleanNameTag}.pdf`;

  let estHeight = 105 + confirmedTxns.length * 9;
  if (effectivePaymentTx) estHeight += 28;
  if (shopAddress) estHeight += 6;
  if (storefrontUrl) estHeight += 9;
  estHeight = Math.max(130, Math.ceil(estHeight));

  const widthMm = 80;
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [widthMm, estHeight],
    compress: true,
  });

  let y = 8;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(100, 116, 139);
  pdf.text(
    effectivePaymentTx ? 'KHATA PAYMENT RECEIPT (JAMA PARCHI)' : 'OFFICIAL STORE KHATA STATEMENT',
    widthMm / 2,
    y,
    { align: 'center' }
  );
  y += 5;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.setTextColor(15, 23, 42);
  const shopLines = pdf.splitTextToSize(shopName.toUpperCase(), 70);
  pdf.text(shopLines, widthMm / 2, y, { align: 'center' });
  y += shopLines.length * 5;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(71, 85, 105);
  if (shopAddress) {
    const addrLines = pdf.splitTextToSize(`${shopAddress}${shopPincode ? ` (${shopPincode})` : ''}`, 68);
    pdf.text(addrLines, widthMm / 2, y, { align: 'center' });
    y += addrLines.length * 3.5;
  }
  const contactParts = [];
  if (shopPhone) contactParts.push(`Ph: ${shopPhone}`);
  if (shopGst) contactParts.push(`GSTIN: ${shopGst}`);
  if (shop?.upiId) contactParts.push(`UPI: ${shop.upiId}`);
  if (contactParts.length > 0) {
    const cLines = pdf.splitTextToSize(contactParts.join(' | '), 70);
    pdf.text(cLines, widthMm / 2, y, { align: 'center' });
    y += cLines.length * 3.4;
  }

  pdf.setDrawColor(203, 213, 225);
  pdf.setLineDashPattern([1.5, 1], 0);
  pdf.line(5, y, 75, y);
  y += 4.5;

  // Customer info
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(15, 23, 42);
  pdf.text(`Account: ${custName}`, 5, y);
  y += 4;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(100, 116, 139);
  pdf.text(`Mobile: ${custPhone || '—'}   |   Printed: ${new Date().toLocaleDateString('en-IN')}`, 5, y);
  y += 5;

  // Jama Parchi highlight box if generated for a specific payment
  pdf.setLineDashPattern([], 0);
  if (effectivePaymentTx) {
    const payAmt = r2(effectivePaymentTx.amount);
    const balBefore = r2(effectivePaymentTx.balanceBefore);
    const balAfter = r2(effectivePaymentTx.balanceAfter);
    const mode = effectivePaymentTx.paymentMode || (effectivePaymentTx.type === 'PAYMENT_UPI' ? 'UPI' : 'CASH');

    pdf.setFillColor(240, 253, 244);
    pdf.setDrawColor(22, 163, 74);
    pdf.rect(5, y, 70, 23, 'FD');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(21, 128, 61);
    pdf.text(`PAYMENT RECEIVED (${mode})`, widthMm / 2, y + 4.5, { align: 'center' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(15, 23, 42);
    pdf.text('Previous Pending Khata:', 7.5, y + 9.2);
    pdf.text(`Rs.${balBefore}`, 72.5, y + 9.2, { align: 'right' });

    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(21, 128, 61);
    pdf.text(`Amount Paid (${mode}):`, 7.5, y + 13.4);
    pdf.text(`-Rs.${payAmt}`, 72.5, y + 13.4, { align: 'right' });

    pdf.setDrawColor(134, 239, 172);
    pdf.line(7.5, y + 15.2, 72.5, y + 15.2);

    pdf.setFontSize(8.5);
    pdf.setTextColor(balAfter === 0 ? 21 : 180, balAfter === 0 ? 128 : 83, balAfter === 0 ? 61 : 9);
    pdf.text('Remaining Khata Balance:', 7.5, y + 19.8);
    pdf.text(balAfter === 0 ? 'Rs.0 (CLEARED)' : `Rs.${balAfter}`, 72.5, y + 19.8, { align: 'right' });
    y += 26;
  }

  // Overall Account Summary Box
  if (currentBal > 0) {
    pdf.setFillColor(254, 243, 199);
    pdf.setDrawColor(217, 119, 6);
  } else {
    pdf.setFillColor(240, 253, 244);
    pdf.setDrawColor(134, 239, 172);
  }
  pdf.rect(5, y, 70, 16, 'FD');

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(71, 85, 105);
  pdf.text(`Total Credit: Rs.${totalCredit}`, 7.5, y + 4.5);
  pdf.text(`Total Paid: Rs.${totalSettled}`, 72.5, y + 4.5, { align: 'right' });

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.5);
  pdf.setTextColor(currentBal > 0 ? 153 : 21, currentBal > 0 ? 27 : 128, currentBal > 0 ? 27 : 61);
  pdf.text(currentBal > 0 ? 'NET PENDING KHATA:' : 'KHATA STATUS:', 7.5, y + 12);
  pdf.text(currentBal > 0 ? `Rs.${currentBal}` : 'Rs.0 (ALL CLEAR)', 72.5, y + 12, { align: 'right' });
  y += 19;

  // Ledger Passbook Rows
  if (confirmedTxns.length > 0) {
    pdf.setFillColor(241, 245, 249);
    pdf.rect(5, y, 70, 5.2, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.8);
    pdf.setTextColor(71, 85, 105);
    pdf.text('DATE & PARTICULAR', 7, y + 3.6);
    pdf.text('AMT', 56, y + 3.6, { align: 'right' });
    pdf.text('BAL', 73, y + 3.6, { align: 'right' });
    y += 7.5;

    for (const tx of confirmedTxns) {
      const dtStr = tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '';
      const isCredit = tx.type === 'CREDIT_BILL' || tx.type === 'MANUAL_CREDIT';
      const isPending = tx.verificationStatus === 'PendingVerification';
      const label = tx.note || (isCredit ? 'Store Credit' : `Payment (${tx.paymentMode || 'CASH'})`);
      const desc = `${dtStr}: ${label}${isPending ? ' [PENDING VERIFY]' : ''}`;
      const descLines = pdf.splitTextToSize(desc, 36).slice(0, 2);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6.8);
      pdf.setTextColor(15, 23, 42);
      pdf.text(descLines, 7, y);

      pdf.setFont('helvetica', 'bold');
      if (isPending) pdf.setTextColor(180, 83, 9);
      else if (isCredit) pdf.setTextColor(185, 28, 28);
      else pdf.setTextColor(21, 128, 61);
      pdf.text(`${isCredit ? '+' : '-'}Rs.${r2(tx.amount)}`, 56, y, { align: 'right' });

      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(71, 85, 105);
      const rowBal = tx.computedBalanceAfter !== undefined ? r2(tx.computedBalanceAfter) : r2(tx.balanceAfter);
      pdf.text(`Rs.${rowBal}`, 73, y, { align: 'right' });

      y += Math.max(descLines.length * 3.3, 4.8) + 1.5;
    }
  }

  y += 2;
  pdf.setDrawColor(203, 213, 225);
  pdf.setLineDashPattern([1.5, 1], 0);
  pdf.line(5, y, 75, y);
  y += 4;

  if (storefrontUrl) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.2);
    pdf.setTextColor(15, 23, 42);
    pdf.text('View Live Store & Digital Passbook:', widthMm / 2, y, { align: 'center' });
    y += 3.8;
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(22, 163, 74);
    pdf.textWithLink(storefrontUrl, widthMm / 2, y, { url: storefrontUrl, align: 'center' });
    y += 5;
  }

  pdf.setFontSize(6.5);
  pdf.setTextColor(148, 163, 184);
  pdf.text('Digital Khata Statement - Powered by PackItOut', widthMm / 2, y, { align: 'center' });

  const blob = pdf.output('blob');
  let file;
  try {
    file = new File([blob], safeFilename, { type: 'application/pdf' });
  } catch {
    file = blob;
    file.name = safeFilename;
  }

  const effectiveAccount = {
    ...account,
    totalCreditGiven: totalCredit,
    totalSettled,
    currentBalance: currentBal,
  };

  return { blob, file, filename: safeFilename, pdf, effectiveAccount, effectivePaymentTx };
}

export async function downloadKhataStatementPdf(account, transactions = [], shopData = {}, options = {}) {
  const res = await createKhataStatementPdfFile(account, transactions, shopData, options);
  try {
    if (res.pdf && typeof res.pdf.save === 'function') res.pdf.save(res.filename);
    else downloadFileBlob(res.blob, res.filename);
  } catch {
    downloadFileBlob(res.blob, res.filename);
  }
  return res;
}

export function buildKhataWhatsAppMessage(account, shopData = {}, options = {}) {
  const shop = shopData || account?.shopId || {};
  const shopName = shop?.name || 'Our Store';
  const shopUpi = shop?.upiId || '';
  const custName = account?.customerName || 'Valued Customer';
  const currentBal = r2(account?.currentBalance);
  const paymentTx = options?.paymentTx || null;
  const storefrontUrl = getShopStorefrontUrl(shop?._id || '', shop?.pincode || '');

  const lines = paymentTx ? [
    `✅ *KHATA PAYMENT RECEIPT (JAMA)*`,
    `🏪 *${shopName}*`,
    ``,
    `Namaste *${custName}* ji! 🙏`,
    `Thank you for your Khata payment:`,
    ``,
    `💵 *Amount Received:* ₹${r2(paymentTx.amount)} (${paymentTx.paymentMode || 'CASH'})`,
    `📊 *Previous Balance:* ₹${r2(paymentTx.balanceBefore)}`,
    `📒 *Remaining Khata Balance:* *₹${r2(paymentTx.balanceAfter)}*${r2(paymentTx.balanceAfter) === 0 ? ' (ALL DUES CLEARED 🎉)' : ''}`,
  ] : [
    `📒 *STORE KHATA STATEMENT*`,
    `🏪 *${shopName}*`,
    ``,
    `Namaste *${custName}* ji! 🙏`,
    `Here is your Store Khata ledger update at *${shopName}*:`,
    ``,
    currentBal > 0
      ? `💰 *Pending Khata Balance:* *₹${currentBal}*`
      : `✅ *Pending Khata Balance:* ₹0 (All Dues Cleared)`,
    `📊 Total Credit Used: ₹${r2(account?.totalCreditGiven)} | Paid: ₹${r2(account?.totalSettled)}`,
    ...(currentBal > 0 && shopUpi ? [`📱 *Pay via UPI ID:* ${shopUpi}`] : []),
  ];

  if (storefrontUrl) {
    lines.push(
      ``,
      `🛒 *Check Live Khata Passbook & Order Online:*`,
      storefrontUrl
    );
  }
  lines.push(``, `_Attached: Official PDF Statement • Powered by PackItOut_ 🙏`);
  return sanitizeWhatsAppText(lines.join('\n'));
}

export async function sendKhataStatementWhatsApp(account, transactions = [], shopData = {}, { toast = null, paymentTx = null } = {}) {
  const cleanPhone = toWhatsAppPhone(account?.customerPhone || account?.userId?.phone);

  try {
    const pdfRes = await createKhataStatementPdfFile(account, transactions, shopData, { paymentTx });
    const effAccount = pdfRes?.effectiveAccount || account;
    const effPaymentTx = pdfRes?.effectivePaymentTx || paymentTx;
    const captionText = buildKhataWhatsAppMessage(effAccount, shopData, { paymentTx: effPaymentTx });

    return await dispatchPdfViaWhatsApp({
      pdfRes,
      cleanPhone,
      shareTitle: effPaymentTx ? `Khata Payment Receipt - ${shopData?.name || 'Store'}` : `Khata Statement - ${shopData?.name || 'Store'}`,
      captionText,
      toast,
      docLabel: effPaymentTx ? 'Khata Payment Receipt PDF' : 'Khata Statement PDF',
    });
  } catch (err) {
    console.error('Error sharing Khata PDF on WhatsApp:', err);
    const captionText = buildKhataWhatsAppMessage(account, shopData, { paymentTx });
    if (toast) toast('Opening WhatsApp…', 'info');
    openWhatsAppChat(cleanPhone, captionText);
    return false;
  }
}

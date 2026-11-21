import React, { useState, useMemo, useEffect } from 'react';
import Fuse from 'fuse.js';
import { useToast, useConfirm, usePrompt } from '../../ui/DialogProvider.jsx';
import { cdnImage } from '../../utils/cloudinaryUrl.js';
import { shopFetch } from '../../utils/api.js';

const BASE_URL = (import.meta.env.VITE_API_BASE || "https://darkslategrey-snail-415133.hostingersite.com");

export default function InventoryTab({
  shopData,
  masterCatalog,
  isCatalogLoading = false,
  catalogError = null,
  isInventoryLoading = false,
  handleInventoryUpdate,
  handleInventoryRemove,
  onInventoryRefresh,
  fetchMasterCatalog,
}) {
  const toast = useToast();
  const confirmDialog = useConfirm();
  const askForValue = usePrompt();
  // --- STATES FOR SEARCH & EDITING ---
  const [searchMaster, setSearchMaster] = useState("");
  const [searchInventoryInput, setSearchInventoryInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [inventoryFilter, setInventoryFilter] = useState("all"); // 'all' | 'featured' | 'outOfStock'
  const [visibleCount, setVisibleCount] = useState(30);
  const [visibleAvailableCount, setVisibleAvailableCount] = useState(40);
  const [isUpdatingRank, setIsUpdatingRank] = useState(false);
  const [isAddProductsOpen, setIsAddProductsOpen] = useState(false);

  useEffect(() => {
    setVisibleCount(30);
  }, [inventoryFilter, appliedSearch]);

  useEffect(() => {
    setVisibleAvailableCount(40);
  }, [searchMaster]);

  // States for Inline Price Editing
  const [editingId, setEditingId] = useState(null);
  const [tempPrice, setTempPrice] = useState("");
  const [addingId, setAddingId] = useState(null);

  // 🚀 STATE FOR BULK IMPORT
  const [isImporting, setIsImporting] = useState(false);

  // 📝 STATE FOR CUSTOM PRODUCT
  const CATEGORIES = ["Dairy, Bread & Eggs", "Fruits & Veg", "Atta, Rice & Dal", "Chips & Namkeen", "Drinks & Juices", "Sweets & Chocolates", "Ice Creams", "Instant Food", "Bath & Body", "Health & Pharma"];
  const initialProductForm = { name: "", brand: "", category: "", mrp: "", qnty: "", emoji: "", image: "", barcode: "" };
  const [newProductForm, setNewProductForm] = useState(initialProductForm);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // ⚖️ STATE FOR PRODUCT VARIANT MODAL
  const [variantModalProduct, setVariantModalProduct] = useState(null);
  const [variantForm, setVariantForm] = useState({ qnty: "", mrp: "", sellingPrice: "", name: "", barcode: "" });
  const [isSubmittingVariant, setIsSubmittingVariant] = useState(false);

  const handleOpenVariantModal = (p) => {
    setVariantModalProduct(p);
    setVariantForm({
      qnty: "",
      mrp: p.mrp ? String(p.mrp) : "",
      sellingPrice: p.mrp ? String(p.mrp) : "",
      name: p.name || "",
      barcode: ""
    });
  };

  const handleVariantQntyChange = (newQnty) => {
    setVariantForm(prev => {
      let updatedName = prev.name;
      if (variantModalProduct) {
        const base = variantModalProduct.name || "";
        const oldQ = variantModalProduct.qnty || "";
        if (oldQ && base.toLowerCase().includes(oldQ.toLowerCase())) {
          updatedName = base.replace(new RegExp(oldQ.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), newQnty);
        } else if (newQnty) {
          updatedName = `${base} ${newQnty}`.trim();
        }
      }
      return { ...prev, qnty: newQnty, name: updatedName };
    });
  };

  const handleSubmitVariant = async (e) => {
    e.preventDefault();
    if (!variantForm.qnty.trim()) {
      return toast("Please enter pack size or quantity (e.g. 35g, 500ml)", "error");
    }
    const sellPrice = Number(variantForm.sellingPrice);
    if (!Number.isFinite(sellPrice) || sellPrice <= 0) {
      return toast("Please enter a valid selling price", "error");
    }
    setIsSubmittingVariant(true);
    try {
      const res = await shopFetch(shopData, `/shops/${shopData._id}/add-variant`, {
        method: "POST",
        body: JSON.stringify({
          baseProductId: variantModalProduct._id,
          qnty: variantForm.qnty.trim(),
          mrp: Number(variantForm.mrp) || sellPrice,
          sellingPrice: sellPrice,
          name: variantForm.name.trim() || variantModalProduct.name,
          barcode: variantForm.barcode.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to add variant");
      }
      toast(`Added ${variantForm.qnty} pack to your store!`);
      setVariantModalProduct(null);
      if (onInventoryRefresh) await onInventoryRefresh();
      if (fetchMasterCatalog) await fetchMasterCatalog();
    } catch (err) {
      console.error(err);
      toast(err.message, "error");
    } finally {
      setIsSubmittingVariant(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await shopFetch(shopData, "/master-products/upload-image", {
        method: "POST",
        body: formData
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Upload failed");
      }
      const data = await res.json();
      setNewProductForm(prev => ({ ...prev, image: data.url }));
      toast("Image uploaded successfully!");
    } catch (err) {
      console.error(err);
      toast(err.message, "error");
    } finally {
      setIsUploadingImage(false);
      e.target.value = null;
    }
  };

  const handleCreateMasterProduct = async (e) => {
    e.preventDefault();
    try {
      const res = await shopFetch(shopData, `/master-products`, {
        method: "POST",
        body: JSON.stringify(newProductForm),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        return toast(errData.error || "Failed to create custom product", 'error');
      }

      const createdProduct = await res.json();
      toast("Custom product added to Master Catalog and your Store!");
      setNewProductForm(initialProductForm);
      setIsCreatingProduct(false);

      if (fetchMasterCatalog) await fetchMasterCatalog();

      // Auto-add to inventory
      if (createdProduct && createdProduct._id) {
        await handleInventoryUpdate(createdProduct._id, createdProduct.mrp, true);
      }
    } catch (err) {
      console.error(err);
      toast("Failed to save custom product.", 'error');
    }
  };

  // 🛡️ SAFETY NETS
  const rawInventory = shopData?.inventory || [];
  const safeInventory = useMemo(() => {
    return rawInventory.filter(i => i && i.product && typeof i.product === 'object' && i.product._id);
  }, [rawInventory]);
  const safeCatalog = masterCatalog || [];

  // --- DATA CALCULATIONS ---
  const shopProductIdSet = useMemo(() => {
    return new Set(safeInventory.map(i => String(i.product?._id || i.product || '')));
  }, [safeInventory]);

  const [remoteSearchResults, setRemoteSearchResults] = useState(null);
  const [isSearchingRemote, setIsSearchingRemote] = useState(false);

  // ⚡ FAST SEARCH: Query server-side across all 5,800+ catalog items on demand
  useEffect(() => {
    const q = searchMaster.trim();
    if (q.length < 2) {
      setRemoteSearchResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingRemote(true);
      try {
        const res = await fetch(`${BASE_URL}/master-products?q=${encodeURIComponent(q)}&limit=50`);
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data) ? data : (data?.items || []);
          setRemoteSearchResults(items);
        }
      } catch {}
      finally { setIsSearchingRemote(false); }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchMaster]);

  const availableToAdd = useMemo(() => {
    return safeCatalog.filter(m => m && !shopProductIdSet.has(String(m._id)));
  }, [safeCatalog, shopProductIdSet]);

  // ⚡ FAST TOKENIZED MASTER CATALOG SEARCH
  const filteredAvailable = useMemo(() => {
    const pool = (remoteSearchResults !== null) ? remoteSearchResults : safeCatalog;
    const candidates = pool.filter(m => m && !shopProductIdSet.has(String(m._id)));
    if (!searchMaster.trim()) return candidates;
    const tokens = searchMaster.toLowerCase().trim().split(/\s+/);
    return candidates.filter(m => {
      const text = `${m.name || ''} ${m.brand || ''} ${m.category || ''} ${m.barcode || ''}`.toLowerCase();
      return tokens.every(t => text.includes(t));
    });
  }, [safeCatalog, remoteSearchResults, searchMaster, shopProductIdSet]);

  // ⚡ FAST TOKENIZED INVENTORY SEARCH WITH FILTER TABS
  const filteredInventory = useMemo(() => {
    let list = safeInventory;
    if (inventoryFilter === 'featured') {
      list = list.filter(i => i.isFeatured);
      // Sort featured items by featuredRank (lowest rank first, e.g. 1, 2, 3...)
      list = [...list].sort((a, b) => (Number(a.featuredRank ?? 999)) - (Number(b.featuredRank ?? 999)));
    } else if (inventoryFilter === 'outOfStock') {
      list = list.filter(i => !i.inStock);
    }

    if (!appliedSearch.trim()) return list;

    const tokens = appliedSearch.toLowerCase().trim().split(/\s+/);
    return list.filter(item => {
      const p = item.product;
      const text = `${p.name || ''} ${p.brand || ''} ${p.category || ''} ${p.barcode || ''} ${Array.isArray(p.searchTags) ? p.searchTags.join(' ') : (p.searchTags || '')}`.toLowerCase();
      return tokens.every(t => text.includes(t));
    });
  }, [safeInventory, inventoryFilter, appliedSearch]);

  const featuredCount = useMemo(() => safeInventory.filter(i => i.isFeatured).length, [safeInventory]);
  const outOfStockCount = useMemo(() => safeInventory.filter(i => !i.inStock).length, [safeInventory]);

  // 🔫 HARDWARE BARCODE SCANNER (USB / BLUETOOTH HID GUN + SCAN-TO-LINK)
  const [scannerListening, setScannerListening] = useState(true);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [scanPriceInput, setScanPriceInput] = useState("");
  const [linkSearchQuery, setLinkSearchQuery] = useState("");
  const [selectedLinkProduct, setSelectedLinkProduct] = useState(null);
  const [isLinkingBarcode, setIsLinkingBarcode] = useState(false);

  const playScannerBeep = (isSuccess = true) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = isSuccess ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(isSuccess ? 920 : 340, ctx.currentTime);
      gain.gain.setValueAtTime(0.14, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + (isSuccess ? 0.09 : 0.22));
    } catch { /* ignore */ }
  };

  const handleBarcodeLookup = (rawCode) => {
    const code = String(rawCode || "").trim();
    if (!code) return;
    setBarcodeInput(code);
    setSelectedLinkProduct(null);
    setLinkSearchQuery("");

    const foundInShop = safeInventory.find(
      i => String(i.product?.barcode || "").trim().toLowerCase() === code.toLowerCase()
    );
    if (foundInShop) {
      playScannerBeep(true);
      setScanPriceInput(String(foundInShop.sellingPrice ?? foundInShop.product?.mrp ?? ""));
      setScanResult({
        status: 'in_shop',
        barcode: code,
        invItem: foundInShop,
        masterItem: foundInShop.product,
      });
      return;
    }

    const foundInCatalog = safeCatalog.find(
      m => String(m?.barcode || "").trim().toLowerCase() === code.toLowerCase()
    );
    if (foundInCatalog) {
      playScannerBeep(true);
      setScanPriceInput(String(foundInCatalog.mrp ?? ""));
      setScanResult({
        status: 'in_catalog',
        barcode: code,
        invItem: null,
        masterItem: foundInCatalog,
      });
      return;
    }

    playScannerBeep(false);
    setScanPriceInput("");
    setScanResult({
      status: 'unlinked',
      barcode: code,
      invItem: null,
      masterItem: null,
    });
  };

  useEffect(() => {
    if (!shopData?.canUseBarcodeScanner || !scannerListening) return;
    let buffer = "";
    let lastKeyTime = 0;

    const onKeyDown = (e) => {
      const tag = (e.target?.tagName || "").toUpperCase();
      const isInputFocused = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      if (isInputFocused) return;

      const now = Date.now();
      if (now - lastKeyTime > 80) {
        buffer = "";
      }
      lastKeyTime = now;

      if (e.key === "Enter") {
        if (buffer.length >= 4) {
          e.preventDefault();
          const scanned = buffer;
          buffer = "";
          handleBarcodeLookup(scanned);
        }
        return;
      }

      if (e.key && e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        buffer += e.key;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [shopData?.canUseBarcodeScanner, scannerListening, safeInventory, safeCatalog]);

  const linkCandidates = useMemo(() => {
    const q = linkSearchQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    const tokens = q.split(/\s+/).filter(Boolean);
    const out = [];
    for (const m of safeCatalog) {
      if (!m || !m.name) continue;
      const hay = `${m.name || ''} ${m.brand || ''} ${m.qnty || ''} ${m.category || ''}`.toLowerCase();
      if (tokens.every(t => hay.includes(t))) {
        out.push(m);
        if (out.length >= 12) break;
      }
    }
    return out;
  }, [linkSearchQuery, safeCatalog]);

  const handleLinkBarcodeAndAdd = async () => {
    if (!scanResult?.barcode || !selectedLinkProduct?._id) return;
    const priceNum = Number(scanPriceInput || selectedLinkProduct.mrp || 0);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      toast("Please enter a valid selling price (₹)", "error");
      return;
    }
    setIsLinkingBarcode(true);
    try {
      const res = await shopFetch(shopData, `/shops/${shopData._id}/barcode-link`, {
        method: "POST",
        body: JSON.stringify({
          barcode: scanResult.barcode,
          productId: selectedLinkProduct._id,
          sellingPrice: priceNum,
          inStock: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(data.error || "Failed to link barcode", "error");
      } else {
        toast(`🔗 Linked barcode ${scanResult.barcode} to "${selectedLinkProduct.name}" & added to store at ₹${priceNum}!`);
        if (fetchMasterCatalog) await fetchMasterCatalog();
        if (onInventoryRefresh) await onInventoryRefresh();
        setScanResult(null);
        setBarcodeInput("");
        setSelectedLinkProduct(null);
        setLinkSearchQuery("");
      }
    } catch {
      toast("Network error while linking barcode", "error");
    }
    setIsLinkingBarcode(false);
  };

  // ⭐ FEATURED DIRECT RANK SETTER WITH AUTO-SHIFT (Rank 1 shifts old #1 to #2, etc.)
  const handleSetDirectRank = async (item, targetRankNumber) => {
    const featuredList = [...safeInventory.filter(i => i.isFeatured)].sort((a, b) => (Number(a.featuredRank ?? 999)) - (Number(b.featuredRank ?? 999)));
    const currentIndex = featuredList.findIndex(f => f.product._id === item.product._id);
    if (currentIndex === -1) return;

    const targetRank = Math.max(1, Math.min(Number(targetRankNumber) || 1, featuredList.length));
    const targetIndex = targetRank - 1;
    if (targetIndex === currentIndex) return;

    // Remove item from its current position and insert at new target position
    const [moved] = featuredList.splice(currentIndex, 1);
    featuredList.splice(targetIndex, 0, moved);

    // Re-assign ranks 1..N so all below targetRank shift down by 1
    const ranksPayload = featuredList.map((f, idx) => ({
      productId: f.product._id,
      featuredRank: idx + 1
    }));

    setIsUpdatingRank(true);
    try {
      const res = await shopFetch(shopData, `/shops/${shopData._id}/inventory/featured-ranks`, {
        method: 'POST',
        body: JSON.stringify({ ranks: ranksPayload })
      });
      if (res.ok) {
        toast(`Set "${item.product.name}" to Rank #${targetRank}! ⭐`);
        if (onInventoryRefresh) await onInventoryRefresh();
      } else {
        const err = await res.json().catch(() => ({}));
        toast(err.error || 'Failed to update rank', 'error');
      }
    } catch (e) {
      toast('Network error', 'error');
    } finally {
      setIsUpdatingRank(false);
    }
  };

  // ⭐ FEATURED RANK REORDER HANDLER (Step Up/Down)
  const handleMoveRank = async (item, direction) => {
    const featuredList = [...safeInventory.filter(i => i.isFeatured)].sort((a, b) => (Number(a.featuredRank ?? 999)) - (Number(b.featuredRank ?? 999)));
    const currentIndex = featuredList.findIndex(f => f.product._id === item.product._id);
    if (currentIndex === -1) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= featuredList.length) return;

    // Swap items in featuredList
    const [moved] = featuredList.splice(currentIndex, 1);
    featuredList.splice(targetIndex, 0, moved);

    // Re-assign ranks 1..N
    const ranksPayload = featuredList.map((f, idx) => ({
      productId: f.product._id,
      featuredRank: idx + 1
    }));

    setIsUpdatingRank(true);
    try {
      const res = await shopFetch(shopData, `/shops/${shopData._id}/inventory/featured-ranks`, {
        method: 'POST',
        body: JSON.stringify({ ranks: ranksPayload })
      });
      if (res.ok) {
        toast(`Moved "${item.product.name}" to Rank #${targetIndex + 1}! ⭐`);
        if (onInventoryRefresh) await onInventoryRefresh();
      } else {
        const err = await res.json().catch(() => ({}));
        toast(err.error || 'Failed to update rank', 'error');
      }
    } catch (e) {
      toast('Network error', 'error');
    } finally {
      setIsUpdatingRank(false);
    }
  };

  // ==========================================
  // ⚡ DYNAMIC BULK IMPORT FUNCTION
  // ==========================================
  const handleBulkImport = async () => {
    const shopId = shopData?._id;
    if (!shopId) {
      toast("Shop ID is missing!", 'error');
      return;
    }

    // 1. Ask the admin for a discount percentage
    const discountInput = await askForValue({
      title: 'Bulk Import Discount',
      message: 'Enter the discount percentage to apply to ALL master products (e.g., 5 for 5% off, or 0 for full MRP).',
      defaultValue: '5',
      placeholder: '0 - 100',
      inputMode: 'numeric',
      confirmText: 'Continue',
    });

    if (discountInput === null) return; // user cancelled

    const discountPercent = Number(discountInput);
    if (isNaN(discountPercent) || discountPercent < 0 || discountPercent > 100) {
      toast("Please enter a valid number between 0 and 100.", 'warn');
      return;
    }

    const confirmImport = await confirmDialog({
      title: 'Wipe & re-import inventory?',
      message: `This will erase your current inventory and import ALL master products at a ${discountPercent}% discount. This cannot be undone.`,
      confirmText: 'Yes, replace inventory',
      cancelText: 'Cancel',
      danger: true,
    });
    if (!confirmImport) return;

    setIsImporting(true);
    try {
      const response = await shopFetch(shopData, `/shops/${shopId}/bulk-import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discountPercent: discountPercent })
      });

      const data = await response.json();
      if (response.ok) {
        toast(data.message || 'Inventory imported!');
        if (onInventoryRefresh) await onInventoryRefresh();
      } else {
        toast(data.error || 'Import failed', 'error');
      }
    } catch (err) {
      toast("Network error. Could not reach the server.", 'error');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div style={{ paddingBottom: '30px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.3rem', fontWeight: '800' }}>📦 Store Inventory</h3>
        <div style={{ fontSize: '0.85rem', color: '#64748b', backgroundColor: '#f1f5f9', padding: '6px 12px', borderRadius: '20px', fontWeight: 'bold' }}>
          {filteredInventory.length} Items Live
        </div>
      </div>

      {/* ========================================= */}
      {/* 🔫 HARDWARE BARCODE SCANNER & SCAN-TO-LINK */}
      {shopData?.canUseBarcodeScanner && (
        <div style={{ marginBottom: '22px', padding: '16px', backgroundColor: '#eff6ff', borderRadius: '16px', border: '1.5px solid #93c5fd', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
            <div>
              <h4 style={{ margin: 0, color: '#1e3a8a', fontSize: '1.05rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🔫 Hardware Barcode Scanner</span>
                <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '999px', backgroundColor: scannerListening ? '#dcfce7' : '#f1f5f9', color: scannerListening ? '#15803d' : '#64748b', border: scannerListening ? '1px solid #86efac' : '1px solid #cbd5e1' }}>
                  {scannerListening ? '🟢 USB/Bluetooth Gun Ready' : '⏸️ Gun Paused'}
                </span>
              </h4>
              <div style={{ fontSize: '0.78rem', color: '#3b82f6', fontWeight: 600, marginTop: '3px' }}>
                Pull trigger on your barcode scanner gun anywhere on this screen, or type a barcode below & press Enter.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  setInventoryFilter('all');
                  setSearchInventoryInput('loose');
                  setAppliedSearch('loose');
                  toast('Filtering Loose / Unpacked items');
                }}
                style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#334155', fontWeight: 700, fontSize: '0.76rem', cursor: 'pointer' }}
                title="Quickly filter loose/unbranded items without barcodes"
              >
                🌾 Loose Items
              </button>
              <button
                type="button"
                onClick={() => setScannerListening(prev => !prev)}
                style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', backgroundColor: scannerListening ? '#1e3a8a' : '#64748b', color: '#fff', fontWeight: 800, fontSize: '0.76rem', cursor: 'pointer' }}
              >
                {scannerListening ? '⏸️ Pause Gun' : '▶️ Resume Gun'}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Scan with USB/Bluetooth gun or type barcode (e.g. 8901058851250) & press Enter..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleBarcodeLookup(barcodeInput);
                }
              }}
              style={{ ...searchInputStyle, flex: 1, marginBottom: 0, border: '1.5px solid #60a5fa' }}
            />
            <button
              type="button"
              onClick={() => handleBarcodeLookup(barcodeInput)}
              style={{ padding: '0 16px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer', flexShrink: 0 }}
            >
              🔍 Scan / Lookup
            </button>
            {(barcodeInput || scanResult) && (
              <button
                type="button"
                onClick={() => { setBarcodeInput(''); setScanResult(null); setSelectedLinkProduct(null); setLinkSearchQuery(''); }}
                style={{ padding: '0 12px', backgroundColor: '#fff', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}
              >
                ✕
              </button>
            )}
          </div>

          {/* 🎯 CASE 1: BARCODE FOUND IN THIS SHOP'S INVENTORY */}
          {scanResult?.status === 'in_shop' && scanResult.invItem && (
            <div style={{ marginTop: '12px', backgroundColor: '#fff', borderRadius: '12px', padding: '14px', border: '2px solid #22c55e', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '10px', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
                  {scanResult.masterItem?.image ? <img src={cdnImage(scanResult.masterItem.image, 120)} style={{ maxWidth: '42px', maxHeight: '42px', objectFit: 'contain' }} alt="" /> : (scanResult.masterItem?.emoji || '📦')}
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#16a34a', textTransform: 'uppercase' }}>
                    ✅ In Your Store • Barcode: {scanResult.barcode}
                  </div>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.98rem' }}>{scanResult.masterItem?.name}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                    {scanResult.masterItem?.qnty} • MRP ₹{scanResult.masterItem?.mrp}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontWeight: 800, color: '#0f172a' }}>Selling ₹</span>
                  <input
                    type="number"
                    value={scanPriceInput}
                    onChange={(e) => setScanPriceInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleInventoryUpdate(scanResult.masterItem._id, scanPriceInput, scanResult.invItem.inStock);
                        toast(`Updated "${scanResult.masterItem.name}" to ₹${scanPriceInput}!`);
                        setScanResult(null);
                        setBarcodeInput('');
                      }
                    }}
                    style={{ width: '80px', padding: '8px', borderRadius: '8px', border: '2px solid #16a34a', fontWeight: 800, fontSize: '0.95rem' }}
                    autoFocus
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleInventoryUpdate(scanResult.masterItem._id, scanPriceInput, scanResult.invItem.inStock);
                    toast(`Updated "${scanResult.masterItem.name}" to ₹${scanPriceInput}!`);
                    setScanResult(null);
                    setBarcodeInput('');
                  }}
                  style={{ padding: '9px 14px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}
                >
                  💾 Save Price
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const nextStock = !scanResult.invItem.inStock;
                    handleInventoryUpdate(scanResult.masterItem._id, scanPriceInput || scanResult.invItem.sellingPrice, nextStock);
                    setScanResult(null);
                    setBarcodeInput('');
                  }}
                  style={{ padding: '9px 12px', backgroundColor: scanResult.invItem.inStock ? '#fef2f2' : '#f0fdf4', color: scanResult.invItem.inStock ? '#dc2626' : '#16a34a', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}
                >
                  {scanResult.invItem.inStock ? '🔴 Mark Out of Stock' : '🟢 Mark In Stock'}
                </button>
              </div>
            </div>
          )}

          {/* 📦 CASE 2: BARCODE FOUND IN MASTER CATALOG (NOT IN SHOP YET) */}
          {scanResult?.status === 'in_catalog' && scanResult.masterItem && (
            <div style={{ marginTop: '12px', backgroundColor: '#fff', borderRadius: '12px', padding: '14px', border: '2px solid #3b82f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '10px', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
                  {scanResult.masterItem?.image ? <img src={cdnImage(scanResult.masterItem.image, 120)} style={{ maxWidth: '42px', maxHeight: '42px', objectFit: 'contain' }} alt="" /> : (scanResult.masterItem?.emoji || '📦')}
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase' }}>
                    📦 Found in Master Catalog • Barcode: {scanResult.barcode}
                  </div>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.98rem' }}>{scanResult.masterItem?.name}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                    {scanResult.masterItem?.qnty} • MRP ₹{scanResult.masterItem?.mrp}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 800, color: '#0f172a' }}>Selling ₹</span>
                <input
                  type="number"
                  value={scanPriceInput}
                  onChange={(e) => setScanPriceInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleInventoryUpdate(scanResult.masterItem._id, scanPriceInput || scanResult.masterItem.mrp, true);
                      toast(`Added "${scanResult.masterItem.name}" to your store!`);
                      setScanResult(null);
                      setBarcodeInput('');
                    }
                  }}
                  style={{ width: '80px', padding: '8px', borderRadius: '8px', border: '2px solid #2563eb', fontWeight: 800, fontSize: '0.95rem' }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    handleInventoryUpdate(scanResult.masterItem._id, scanPriceInput || scanResult.masterItem.mrp, true);
                    toast(`Added "${scanResult.masterItem.name}" to your store!`);
                    setScanResult(null);
                    setBarcodeInput('');
                  }}
                  style={{ padding: '9px 14px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}
                >
                  ➕ Add to Store
                </button>
              </div>
            </div>
          )}

          {/* 🔗 CASE 3: BARCODE NOT RECOGNIZED YET -> SCAN-TO-LINK WORKFLOW */}
          {scanResult?.status === 'unlinked' && (
            <div style={{ marginTop: '12px', backgroundColor: '#fffbeb', borderRadius: '12px', padding: '14px', border: '2px solid #f59e0b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                <div>
                  <div style={{ fontWeight: 900, color: '#92400e', fontSize: '0.92rem' }}>
                    🔗 Barcode "{scanResult.barcode}" is not linked to any item yet
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#b45309', fontWeight: 600 }}>
                    Search the product below once to permanently link this barcode for future scans!
                  </div>
                </div>
                {shopData?.canAddMasterProducts && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingProduct(true);
                      setNewProductForm(prev => ({ ...prev, barcode: scanResult.barcode }));
                      setScanResult(null);
                    }}
                    style={{ padding: '6px 12px', backgroundColor: '#a21caf', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}
                  >
                    ✨ Or Create Brand-New Product with Barcode
                  </button>
                )}
              </div>

              {!selectedLinkProduct ? (
                <>
                  <input
                    type="text"
                    placeholder="Type product name to link barcode (e.g. Maggi, Parle G, Surf Excel)..."
                    value={linkSearchQuery}
                    onChange={(e) => setLinkSearchQuery(e.target.value)}
                    style={{ ...searchInputStyle, marginBottom: '8px', border: '1.5px solid #f59e0b' }}
                    autoFocus
                  />
                  {linkCandidates.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '8px', maxHeight: '210px', overflowY: 'auto' }}>
                      {linkCandidates.map(cand => (
                        <div
                          key={cand._id}
                          onClick={() => {
                            setSelectedLinkProduct(cand);
                            setScanPriceInput(String(cand.mrp || ''));
                          }}
                          style={{ backgroundColor: '#fff', padding: '8px 10px', borderRadius: '8px', border: '1px solid #fde68a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                          <div style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {cand.image ? <img src={cdnImage(cand.image, 80)} style={{ maxWidth: '32px', maxHeight: '32px', objectFit: 'contain' }} alt="" /> : (cand.emoji || '📦')}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 800, fontSize: '0.8rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cand.name}</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>{cand.qnty} • MRP ₹{cand.mrp}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '10px', border: '1.5px solid #f59e0b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#d97706' }}>LINKING BARCODE {scanResult.barcode} TO:</div>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>{selectedLinkProduct.name} ({selectedLinkProduct.qnty})</div>
                    <div style={{ fontSize: '0.76rem', color: '#64748b' }}>MRP: ₹{selectedLinkProduct.mrp}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 800, color: '#0f172a' }}>Selling ₹</span>
                    <input
                      type="number"
                      value={scanPriceInput}
                      onChange={(e) => setScanPriceInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleLinkBarcodeAndAdd(); }}
                      style={{ width: '80px', padding: '8px', borderRadius: '8px', border: '2px solid #f59e0b', fontWeight: 800 }}
                      autoFocus
                    />
                    <button
                      type="button"
                      disabled={isLinkingBarcode}
                      onClick={handleLinkBarcodeAndAdd}
                      style={{ padding: '9px 14px', backgroundColor: '#d97706', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}
                    >
                      {isLinkingBarcode ? '⏳ Linking...' : '🔗 Link Barcode & Add to Store'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedLinkProduct(null)}
                      style={{ padding: '9px 10px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}
                    >
                      Change
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 🛠️ CREATE CUSTOM PRODUCT SECTION            */}
      {/* ========================================= */}
      {shopData?.canAddMasterProducts && (
        <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#fdf4ff', borderRadius: '16px', border: '1px solid #f5d0fe' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h4 style={{ margin: 0, color: '#a21caf', fontSize: '1.1rem', fontWeight: '800' }}>✨ Create Custom Product</h4>
            <button
              onClick={() => setIsCreatingProduct(!isCreatingProduct)}
              style={{ backgroundColor: '#a21caf', color: '#fff', padding: '6px 12px', borderRadius: '8px', border: 'none', fontWeight: '800', cursor: 'pointer' }}
            >
              {isCreatingProduct ? "Cancel" : "+ New Product"}
            </button>
          </div>

          {isCreatingProduct && (
            <form onSubmit={handleCreateMasterProduct} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
                <input required type="text" placeholder="Name (e.g. Local Bread)" value={newProductForm.name} onChange={e => setNewProductForm({ ...newProductForm, name: e.target.value })} style={searchInputStyle} />
                <input required type="text" placeholder="Brand" value={newProductForm.brand} onChange={e => setNewProductForm({ ...newProductForm, brand: e.target.value })} style={searchInputStyle} />
                <select required value={newProductForm.category} onChange={e => setNewProductForm({ ...newProductForm, category: e.target.value })} style={searchInputStyle}>
                  <option value="">Select Category</option>
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <input required type="number" placeholder="MRP (₹)" value={newProductForm.mrp} onChange={e => setNewProductForm({ ...newProductForm, mrp: e.target.value })} style={searchInputStyle} />
                <input required type="text" placeholder="Quantity (e.g. 1 unit)" value={newProductForm.qnty} onChange={e => setNewProductForm({ ...newProductForm, qnty: e.target.value })} style={searchInputStyle} />
                <input type="text" placeholder="Emoji (e.g. 🍞)" value={newProductForm.emoji} onChange={e => setNewProductForm({ ...newProductForm, emoji: e.target.value })} style={searchInputStyle} />
                <input type="text" placeholder="Barcode (Optional)" value={newProductForm.barcode || ""} onChange={e => setNewProductForm({ ...newProductForm, barcode: e.target.value })} style={searchInputStyle} />
                <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                  <input type="text" placeholder="Image URL (Optional)" value={newProductForm.image} onChange={e => setNewProductForm({ ...newProductForm, image: e.target.value })} style={{ ...searchInputStyle, flex: 1, marginBottom: 0 }} />
                  <label style={{ cursor: isUploadingImage ? 'wait' : 'pointer', padding: '12px 10px', backgroundColor: '#e879f9', color: 'white', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', height: '100%' }}>
                    {isUploadingImage ? '⏳' : '📁 Upload'}
                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} disabled={isUploadingImage} />
                  </label>
                </div>
              </div>
              <button type="submit" style={{ padding: '12px', backgroundColor: '#a21caf', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '5px' }}>
                Save & Auto-Add to Store
              </button>
            </form>
          )}
        </div>
      )}

      {/* ========================================= */}
      {/* 🚀 ADD NEW PRODUCTS SECTION               */}
      {/* ===      {/* ========================================= */}
      {/* 🚀 ADD NEW PRODUCTS SECTION (COLLAPSIBLE) */}
      {/* ========================================= */}
      <div style={{ marginBottom: '22px', borderRadius: '16px', border: '1.5px solid #bae6fd', backgroundColor: '#f0f9ff', overflow: 'hidden', boxShadow: '0 2px 8px rgba(2, 132, 199, 0.06)' }}>

        <button
          type="button"
          onClick={() => setIsAddProductsOpen(prev => !prev)}
          style={{
            width: '100%',
            padding: '14px 18px',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            color: 'white',
            border: 'none',
            fontWeight: '800',
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>➕</span>
            <span>Add New Products to Store ({isCatalogLoading ? 'Loading…' : `${availableToAdd.length} catalog items`})</span>
          </span>
          <span style={{ fontSize: '0.8rem', backgroundColor: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '20px' }}>
            {isAddProductsOpen ? '▲ Collapse' : '▼ Tap to Open'}
          </span>
        </button>

        {isAddProductsOpen && (
          <div style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <div style={{ fontSize: '0.85rem', color: '#0369a1', fontWeight: '700' }}>
                Browse master catalog or bulk import into your store
              </div>

              {/* ⚡ THE BULK IMPORT BUTTON ⚡ */}
              <button
                onClick={handleBulkImport}
                disabled={isImporting || isCatalogLoading || availableToAdd.length === 0}
                style={{
                  backgroundColor: (isImporting || isCatalogLoading || availableToAdd.length === 0) ? '#94a3b8' : '#0f172a',
                  color: '#fff',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontWeight: '800',
                  fontSize: '0.8rem',
                  border: 'none',
                  cursor: (isImporting || isCatalogLoading || availableToAdd.length === 0) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                }}
              >
                {isImporting ? '⏳ Importing...' : '⚡ Bulk Import Catalog'}
              </button>
            </div>

            {/* Search Master Catalog */}
            <input
              type="text"
              placeholder="🔍 Search master catalog (e.g., Milk, Lay's)..."
              value={searchMaster}
              onChange={(e) => setSearchMaster(e.target.value)}
              style={searchInputStyle}
            />

            {isCatalogLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px 10px', gap: '10px', color: '#0284c7' }}>
                <div className="pio-spinner" style={{ width: '28px', height: '28px', border: '3px solid #bae6fd', borderTopColor: '#0284c7', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <span style={{ fontSize: '0.88rem', fontWeight: '600' }}>Loading master catalog...</span>
              </div>
            ) : catalogError ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 10px', gap: '10px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.88rem', color: '#dc2626', fontWeight: '600' }}>⚠️ Could not load master catalog ({catalogError})</span>
                <button
                  onClick={() => fetchMasterCatalog && fetchMasterCatalog()}
                  style={{ padding: '8px 18px', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  🔄 Retry Catalog
                </button>
              </div>
            ) : availableToAdd.length === 0 ? (
              <div style={{ fontSize: '0.9rem', color: '#0284c7', marginTop: '15px', fontWeight: 'bold', textAlign: 'center' }}>🎉 You have added every available product!</div>
            ) : filteredAvailable.length === 0 ? (
              <div style={{ fontSize: '0.88rem', color: '#64748b', marginTop: '15px', fontWeight: '600', textAlign: 'center' }}>No products found matching "{searchMaster}".</div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px', marginTop: '10px', maxHeight: '280px', overflowY: 'auto', paddingRight: '5px' }}>
                  {filteredAvailable.slice(0, visibleAvailableCount).map(m => (
                    <div key={m._id} style={{ backgroundColor: 'white', padding: '10px', borderRadius: '12px', border: '1px solid #bae6fd', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>

                      {/* Product Info */}
                      <div style={{ marginBottom: '10px' }}>
                        <div style={{ fontSize: '24px', marginBottom: '5px' }}>{m.image ? <img src={cdnImage(m.image, 100)} alt="" loading="lazy" decoding="async" style={{ height: '30px', objectFit: 'contain' }} /> : m.emoji}</div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#0f172a', lineHeight: '1.2', height: '30px', overflow: 'hidden' }}>{m.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', fontWeight: '600' }}>MRP: ₹{m.mrp}</div>
                      </div>

                      {/* Inline Add Action */}
                      {addingId === m._id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          <input type="number" placeholder={`₹${m.mrp}`} value={tempPrice} onChange={e => setTempPrice(e.target.value)} style={{ padding: '6px', borderRadius: '6px', border: '2px solid #0284c7', outline: 'none', fontSize: '0.9rem', textAlign: 'center', fontWeight: 'bold' }} autoFocus />
                          <div style={{ display: 'flex', gap: '5px' }}>
                            <button onClick={() => setAddingId(null)} style={{ flex: 1, padding: '6px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>❌</button>
                            <button
                              onClick={async () => {
                                await handleInventoryUpdate(m._id, tempPrice || m.mrp, true);
                                if (onInventoryRefresh) onInventoryRefresh();
                                setAddingId(null);
                                setTempPrice("");
                              }}
                              style={{ flex: 1, padding: '6px', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          <button onClick={() => { setAddingId(m._id); setTempPrice(m.mrp); }} style={{ width: '100%', padding: '8px 6px', backgroundColor: '#e0f2fe', color: '#0284c7', border: 'none', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}>
                            + Add to Store
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenVariantModal(m)}
                            style={{
                              width: '100%',
                              padding: '5px 4px',
                              backgroundColor: '#f8fafc',
                              color: '#0369a1',
                              border: '1px dashed #7dd3fc',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: '700',
                              cursor: 'pointer'
                            }}
                            title="Add this product with different weight, pack size, or price (e.g. 35g for ₹10)"
                          >
                            ⚖️ Different Size?
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {filteredAvailable.length > visibleAvailableCount && (
                  <button
                    type="button"
                    onClick={() => setVisibleAvailableCount(prev => prev + 40)}
                    style={{
                      width: '100%',
                      marginTop: '10px',
                      padding: '8px',
                      backgroundColor: '#e0f2fe',
                      color: '#0369a1',
                      border: '1px solid #7dd3fc',
                      borderRadius: '8px',
                      fontWeight: '800',
                      fontSize: '0.82rem',
                      cursor: 'pointer'
                    }}
                  >
                    Show More Catalog Items ({filteredAvailable.length - visibleAvailableCount} more)
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* ========================================= */}
      {/* 📦 EXISTING INVENTORY SECTION             */}
      {/* ========================================= */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 12px 0', flexWrap: 'wrap', gap: '10px' }}>
        <h4 style={{ margin: 0, color: '#0f172a', fontSize: '1.15rem', fontWeight: '800' }}>Active Store Inventory</h4>
        <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>
          Showing {Math.min(visibleCount, filteredInventory.length)} of {filteredInventory.length}
        </div>
      </div>

      {/* 🏷️ FILTER PILLS FOR FAST GROUPING & FEATURED OVERVIEW */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '15px', overflowX: 'auto', paddingBottom: '4px' }}>
        <button
          onClick={() => { setInventoryFilter('all'); setSearchInventoryInput(''); setAppliedSearch(''); }}
          style={{
            padding: '8px 14px',
            borderRadius: '20px',
            border: 'none',
            fontSize: '0.85rem',
            fontWeight: '700',
            cursor: 'pointer',
            backgroundColor: inventoryFilter === 'all' ? '#0f172a' : '#e2e8f0',
            color: inventoryFilter === 'all' ? '#fff' : '#475569',
            transition: '0.15s'
          }}
        >
          📦 All Items ({safeInventory.length})
        </button>
        <button
          onClick={() => { setInventoryFilter('featured'); setSearchInventoryInput(''); setAppliedSearch(''); }}
          style={{
            padding: '8px 14px',
            borderRadius: '20px',
            border: 'none',
            fontSize: '0.85rem',
            fontWeight: '700',
            cursor: 'pointer',
            backgroundColor: inventoryFilter === 'featured' ? '#d97706' : '#fef3c7',
            color: inventoryFilter === 'featured' ? '#fff' : '#b45309',
            boxShadow: inventoryFilter === 'featured' ? '0 2px 8px rgba(217,119,6,0.3)' : 'none',
            transition: '0.15s'
          }}
        >
          ⭐ Featured Picks ({featuredCount})
        </button>
        <button
          onClick={() => { setInventoryFilter('outOfStock'); setSearchInventoryInput(''); setAppliedSearch(''); }}
          style={{
            padding: '8px 14px',
            borderRadius: '20px',
            border: 'none',
            fontSize: '0.85rem',
            fontWeight: '700',
            cursor: 'pointer',
            backgroundColor: inventoryFilter === 'outOfStock' ? '#dc2626' : '#fee2e2',
            color: inventoryFilter === 'outOfStock' ? '#fff' : '#b91c1c',
            transition: '0.15s'
          }}
        >
          🔴 Out of Stock ({outOfStockCount})
        </button>
      </div>

      {inventoryFilter === 'featured' && (
        <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '10px 14px', marginBottom: '15px', fontSize: '0.85rem', color: '#92400e', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>💡</span>
          <span><strong>Shopkeeper's Picks Ranking:</strong> Use the ⬆️ and ⬇️ buttons below to order which item shows 1st, 2nd, etc. on the customer app home screen!</span>
        </div>
      )}

      {/* Search Current Inventory with Dedicated Search & Clear Buttons */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            placeholder={`Search in ${inventoryFilter === 'featured' ? 'Featured Picks' : inventoryFilter === 'outOfStock' ? 'Out of Stock' : 'Store'}...`}
            value={searchInventoryInput}
            onChange={(e) => setSearchInventoryInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setAppliedSearch(searchInventoryInput.trim());
                setVisibleCount(30);
              }
            }}
            style={{ ...searchInputStyle, paddingRight: searchInventoryInput ? '36px' : '14px', marginBottom: 0 }}
          />
          {searchInventoryInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInventoryInput('');
                setAppliedSearch('');
                setVisibleCount(30);
              }}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', fontSize: '1rem', cursor: 'pointer', padding: '4px' }}
            >
              ✕
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            setAppliedSearch(searchInventoryInput.trim());
            setVisibleCount(30);
          }}
          style={{
            padding: '0 16px',
            backgroundColor: '#0f172a',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            fontWeight: '800',
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexShrink: 0
          }}
        >
          🔍 Search
        </button>
      </div>

      {appliedSearch && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#e0f2fe', padding: '6px 12px', borderRadius: '8px', marginBottom: '12px', fontSize: '0.82rem', color: '#0369a1', fontWeight: '700' }}>
          <span>Search results for "{appliedSearch}" ({filteredInventory.length} matching)</span>
          <button onClick={() => { setSearchInventoryInput(''); setAppliedSearch(''); }} style={{ background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer', fontWeight: '800', textDecoration: 'underline' }}>
            Show All
          </button>
        </div>
      )}

      {isInventoryLoading && safeInventory.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', backgroundColor: 'white', borderRadius: '16px', color: '#0284c7', fontWeight: '600', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <div className="pio-spinner" style={{ width: '28px', height: '28px', border: '3px solid #bae6fd', borderTopColor: '#0284c7', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <span>Loading store inventory...</span>
        </div>
      ) : filteredInventory.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', backgroundColor: 'white', borderRadius: '16px', color: '#64748b', fontWeight: '600' }}>
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🔍</div>
          <div>No items match your {appliedSearch ? 'search query' : 'selected filter'}.</div>
          {(inventoryFilter !== 'all' || appliedSearch) && (
            <button
              onClick={() => { setInventoryFilter('all'); setSearchInventoryInput(''); setAppliedSearch(''); }}
              style={{ marginTop: '12px', padding: '8px 16px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem' }}
            >
              View All Items
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {filteredInventory.slice(0, visibleCount).map((item, index) => {
            if (!item?.product) return null;
            const isOutOfStock = !item.inStock;
            const isFeaturedView = inventoryFilter === 'featured';

            return (
              <div key={item.product._id} style={{ ...cardStyle, border: item.isFeatured ? '2px solid #fde68a' : isOutOfStock ? '2px solid #fecaca' : '1px solid #e2e8f0', opacity: isOutOfStock ? 0.85 : 1, position: 'relative' }}>

                {/* 🌟 FEATURED RANK BADGE & REORDER CONTROLS */}
                {item.isFeatured && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fffbeb', padding: '8px 12px', borderRadius: '10px', marginBottom: '10px', border: '1px solid #fef3c7', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '1rem' }}>⭐</span>
                      <span style={{ fontWeight: '800', color: '#b45309', fontSize: '0.85rem' }}>
                        Shopkeeper Pick #{index + 1}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {/* DIRECT RANK SELECTOR DROPDOWN */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '0.78rem', color: '#92400e', fontWeight: '700' }}>Rank:</span>
                        <select
                          value={index + 1}
                          disabled={isUpdatingRank}
                          onChange={(e) => handleSetDirectRank(item, Number(e.target.value))}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: '1.5px solid #f59e0b',
                            backgroundColor: '#fff',
                            fontWeight: '800',
                            color: '#b45309',
                            fontSize: '0.82rem',
                            cursor: isUpdatingRank ? 'wait' : 'pointer',
                            outline: 'none'
                          }}
                        >
                          {Array.from({ length: featuredCount }, (_, i) => i + 1).map(r => (
                            <option key={r} value={r}>
                              #{r} {r === 1 ? '🥇' : r === 2 ? '🥈' : r === 3 ? '🥉' : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* ⬆️ / ⬇️ STEP BUTTONS */}
                      <div style={{ display: 'flex', gap: '3px' }}>
                        <button
                          title="Move Up by 1 step"
                          disabled={isUpdatingRank || index === 0}
                          onClick={() => handleMoveRank(item, 'up')}
                          style={{
                            backgroundColor: index === 0 ? '#f1f5f9' : '#fef3c7',
                            color: index === 0 ? '#94a3b8' : '#b45309',
                            border: '1px solid #fde68a',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            cursor: (isUpdatingRank || index === 0) ? 'not-allowed' : 'pointer',
                            fontWeight: '800',
                            fontSize: '0.8rem'
                          }}
                        >
                          ⬆️
                        </button>
                        <button
                          title="Move Down by 1 step"
                          disabled={isUpdatingRank || index === filteredInventory.length - 1}
                          onClick={() => handleMoveRank(item, 'down')}
                          style={{
                            backgroundColor: index === filteredInventory.length - 1 ? '#f1f5f9' : '#fef3c7',
                            color: index === filteredInventory.length - 1 ? '#94a3b8' : '#b45309',
                            border: '1px solid #fde68a',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            cursor: (isUpdatingRank || index === filteredInventory.length - 1) ? 'not-allowed' : 'pointer',
                            fontWeight: '800',
                            fontSize: '0.8rem'
                          }}
                        >
                          ⬇️
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', width: '100%' }}>
                  {/* Image/Emoji */}
                  <div style={{ width: '56px', height: '56px', backgroundColor: '#f8fafc', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>
                    {item.product.image ? <img src={cdnImage(item.product.image, 150)} loading="lazy" decoding="async" style={{ maxWidth: '44px', maxHeight: '44px', objectFit: 'contain' }} alt="" /> : item.product.emoji}
                  </div>

                  {/* Details */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '0.95rem', lineHeight: '1.2' }}>{item.product.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>
                        {item.product.qnty} • MRP ₹{item.product.mrp}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenVariantModal(item.product)}
                        style={{
                          background: '#f0f9ff',
                          border: '1px solid #bae6fd',
                          color: '#0369a1',
                          fontSize: '0.72rem',
                          cursor: 'pointer',
                          fontWeight: '800',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                        title="Add another pack size or weight for this product (e.g. 35g, 500g)"
                      >
                        <span>⚖️</span> + Add Size
                      </button>
                    </div>

                    {/* Inline Price Editor */}
                    {editingId === item.product._id ? (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold', color: '#334155' }}>₹</span>
                        <input type="number" value={tempPrice} onChange={e => setTempPrice(e.target.value)} style={{ width: '70px', padding: '6px', borderRadius: '6px', border: '2px solid #16a34a', outline: 'none', fontWeight: 'bold' }} autoFocus />
                        <button onClick={() => { handleInventoryUpdate(item.product._id, tempPrice, item.inStock); setEditingId(null); }} style={{ padding: '6px 12px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Save</button>
                        <button onClick={() => setEditingId(null)} style={{ padding: '6px 10px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>❌</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: '900', color: '#16a34a', fontSize: '1.1rem' }}>₹{item.sellingPrice}</span>
                        <button onClick={() => { setEditingId(item.product._id); setTempPrice(item.sellingPrice); }} style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '800', padding: 0, textDecoration: 'underline' }}>
                          Edit Price
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 🔴🟢 MASSIVE OUT OF STOCK & FEATURED TOGGLES */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                  <button
                    onClick={() => handleInventoryUpdate(item.product._id, item.sellingPrice, !item.inStock)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '10px',
                      fontWeight: '800',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '4px',
                      backgroundColor: item.inStock ? '#f0fdf4' : '#fef2f2',
                      color: item.inStock ? '#16a34a' : '#dc2626',
                      border: item.inStock ? '1px solid #bbf7d0' : '1px solid #fecaca',
                      transition: '0.2s',
                      boxShadow: item.inStock ? '0 4px 6px rgba(22, 163, 74, 0.05)' : 'none'
                    }}
                  >
                    {item.inStock ? "🟢 IN STOCK" : "🔴 OUT OF STOCK"}
                  </button>
                  <button
                    onClick={() => {
                      const nextFeatured = !item.isFeatured;
                      const nextRank = nextFeatured ? (featuredCount + 1) : 999;
                      handleInventoryUpdate(item.product._id, item.sellingPrice, item.inStock, nextFeatured, nextRank);
                    }}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '10px',
                      fontWeight: '800',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '4px',
                      backgroundColor: item.isFeatured ? '#fffbeb' : '#f8fafc',
                      color: item.isFeatured ? '#d97706' : '#64748b',
                      border: item.isFeatured ? '1px solid #fde68a' : '1px solid #e2e8f0',
                      transition: '0.2s',
                    }}
                  >
                    {item.isFeatured ? "⭐ FEATURED" : "☆ FEATURE ITEM"}
                  </button>
                  <button
                    onClick={async () => {
                      if (await confirmDialog({ title: 'Remove Item?', message: 'Are you sure you want to remove this item from your store?', confirmText: 'Yes, Remove', danger: true })) {
                        handleInventoryRemove(item.product._id);
                      }
                    }}
                    style={{
                      padding: '12px 18px',
                      borderRadius: '10px',
                      fontWeight: '800',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      backgroundColor: '#fff1f2',
                      color: '#e11d48',
                      border: '1px solid #fecdd3',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    🗑️
                  </button>
                </div>

              </div>
            );
          })}

          {/* ⚡ LOAD MORE BUTTON (ELIMINATES BROWSER FREEZING/CRASHING) */}
          {filteredInventory.length > visibleCount && (
            <button
              onClick={() => setVisibleCount(prev => prev + 30)}
              style={{
                padding: '14px',
                borderRadius: '12px',
                backgroundColor: '#0f172a',
                color: '#fff',
                border: 'none',
                fontWeight: '800',
                fontSize: '0.95rem',
                cursor: 'pointer',
                marginTop: '10px',
                boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
              }}
            >
              📥 Load More Items ({filteredInventory.length - visibleCount} remaining)
            </button>
          )}
        </div>
      )}

      {/* ⚖️ ADD VARIANT / PACK SIZE MODAL */}
      {variantModalProduct && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            maxWidth: '460px',
            width: '100%',
            padding: '22px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: '800' }}>
                  ⚖️ Add Size / Variant
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  Reuses master product photo & info. Enter your shop's pack size and price.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setVariantModalProduct(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                ✕
              </button>
            </div>

            {/* Base Product Preview */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '10px 12px',
              marginBottom: '16px'
            }}>
              <div style={{ width: '44px', height: '44px', backgroundColor: '#fff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #e2e8f0' }}>
                {variantModalProduct.image ? (
                  <img src={cdnImage(variantModalProduct.image, 100)} alt="" style={{ maxWidth: '36px', maxHeight: '36px', objectFit: 'contain' }} />
                ) : (
                  <span style={{ fontSize: '1.4rem' }}>{variantModalProduct.emoji || '📦'}</span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {variantModalProduct.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                  {variantModalProduct.brand ? `${variantModalProduct.brand} • ` : ''}Base Pack: {variantModalProduct.qnty || 'Standard'} (MRP ₹{variantModalProduct.mrp})
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitVariant} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '800', color: '#334155', marginBottom: '4px' }}>
                    Pack Size / Weight *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. 35g, 500g, 1L"
                    value={variantForm.qnty}
                    onChange={(e) => handleVariantQntyChange(e.target.value)}
                    style={{ ...searchInputStyle, padding: '10px 12px', fontSize: '0.88rem' }}
                    autoFocus
                  />
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '3px' }}>e.g. 35g, 100g, 500ml</div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '800', color: '#334155', marginBottom: '4px' }}>
                    Pack MRP (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 10"
                    value={variantForm.mrp}
                    onChange={(e) => setVariantForm(prev => ({ ...prev, mrp: e.target.value }))}
                    style={{ ...searchInputStyle, padding: '10px 12px', fontSize: '0.88rem' }}
                  />
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '3px' }}>Printed on pack</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '800', color: '#16a34a', marginBottom: '4px' }}>
                    Your Selling Price (₹) *
                  </label>
                  <input
                    required
                    type="number"
                    placeholder="e.g. 10"
                    value={variantForm.sellingPrice}
                    onChange={(e) => setVariantForm(prev => ({ ...prev, sellingPrice: e.target.value }))}
                    style={{ ...searchInputStyle, padding: '10px 12px', fontSize: '0.88rem', borderColor: '#86efac', backgroundColor: '#f0fdf4' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '800', color: '#334155', marginBottom: '4px' }}>
                    Barcode (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Scan or type barcode"
                    value={variantForm.barcode}
                    onChange={(e) => setVariantForm(prev => ({ ...prev, barcode: e.target.value }))}
                    style={{ ...searchInputStyle, padding: '10px 12px', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '800', color: '#334155', marginBottom: '4px' }}>
                  Variant Name
                </label>
                <input
                  type="text"
                  placeholder="Product Name with Size"
                  value={variantForm.name}
                  onChange={(e) => setVariantForm(prev => ({ ...prev, name: e.target.value }))}
                  style={{ ...searchInputStyle, padding: '10px 12px', fontSize: '0.88rem' }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setVariantModalProduct(null)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#f8fafc',
                    color: '#475569',
                    fontWeight: '800',
                    fontSize: '0.88rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingVariant}
                  style={{
                    flex: 2,
                    padding: '10px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: '#0284c7',
                    color: '#fff',
                    fontWeight: '800',
                    fontSize: '0.88rem',
                    cursor: isSubmittingVariant ? 'wait' : 'pointer',
                    boxShadow: '0 4px 10px rgba(2, 132, 199, 0.25)',
                    opacity: isSubmittingVariant ? 0.7 : 1
                  }}
                >
                  {isSubmittingVariant ? 'Adding to Store...' : '✨ Add Variant to Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// PREMIUM STYLING
const searchInputStyle = { width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none', backgroundColor: 'white', fontWeight: '500' };
const cardStyle = { backgroundColor: 'white', padding: '16px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', transition: '0.2s' };


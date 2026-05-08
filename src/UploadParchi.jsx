import React, { useState, useRef } from 'react';
import { useToast, useConfirm } from './ui/DialogProvider.jsx';
import ParchiReviewModal from './ParchiReviewModal.jsx';

// ⚡ Instant Image Compressor
const compressImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 1200; // higher for OCR clarity

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          resolve(compressedFile);
        }, 'image/jpeg', 0.85);
      };
    };
  });
};

export default function UploadParchi({ onAddToCart }) {
  const toast = useToast();
  const askConfirm = useConfirm();
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedItems, setExtractedItems] = useState(null);
  const [lastFile, setLastFile] = useState(null);
  const [sendingToShop, setSendingToShop] = useState(false);

  const fileInputRef = useRef(null);
  const BASE_URL = "https://darkslategrey-snail-415133.hostingersite.com";

  const sendRawToShop = async (file) => {
    if (!file) {
      toast("Please pick the photo again.", 'warn');
      return false;
    }
    setSendingToShop(true);
    try {
      const formData = new FormData();
      formData.append("parchiImage", file);
      const savedUser = JSON.parse(localStorage.getItem("packitout_user") || "{}");
      formData.append("customerName", savedUser.name || "Guest Customer");
      formData.append("userId", savedUser._id || "guest_id");
      const shopId = savedUser.primaryShop?._id || savedUser.primaryShop || "Master_Shop";
      formData.append("shopId", shopId);

      const res = await fetch(`${BASE_URL}/upload-parchi`, { method: "POST", body: formData });
      const data = await res.json();
      setSendingToShop(false);
      if (res.ok && data.success) {
        toast("Parchi sent to the shop! They'll prepare your bill.");
        return true;
      }
      throw new Error(data.error || "Upload failed");
    } catch (err) {
      setSendingToShop(false);
      console.error(err);
      toast(err.message || "Couldn't reach the shop. Try again.", 'error');
      return false;
    }
  };

  const handleUploadClick = () => {
    if (!onAddToCart) {
      toast("Open the app from a shop to use Upload Parchi.", 'info');
      return;
    }
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const originalFile = e.target.files[0];
    if (!originalFile) return;

    setIsExtracting(true);

    let compressedFile;
    try {
      compressedFile = await compressImage(originalFile);
      setLastFile(compressedFile);

      const formData = new FormData();
      formData.append("parchiImage", compressedFile);

      const savedUser = JSON.parse(localStorage.getItem("packitout_user") || "{}");
      formData.append("customerName", savedUser.name || "Guest Customer");
      formData.append("userId", savedUser._id || "guest_id");
      const shopId = savedUser.primaryShop?._id || savedUser.primaryShop || "";
      formData.append("shopId", shopId);

      const res = await fetch(`${BASE_URL}/extract-parchi`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsExtracting(false);
        if (Array.isArray(data.items) && data.items.length > 0) {
          setExtractedItems(data.items);
        } else {
          await offerSendToShopFallback(compressedFile, "We couldn't read any items from that photo.");
        }
      } else {
        throw new Error(data.error || "Extraction failed");
      }
    } catch (err) {
      console.error(err);
      setIsExtracting(false);
      await offerSendToShopFallback(compressedFile, err.message || "AI couldn't read the parchi.");
    }

    e.target.value = null;
  };

  const offerSendToShopFallback = async (file, reason) => {
    const ok = await askConfirm({
      title: "Send the photo to the shopkeeper?",
      message: `${reason}\n\nWe can send the original photo to the shop instead — they'll read it and build your bill manually.`,
      confirmText: "Send to shop",
      cancelText: "No, cancel",
      danger: false,
    });
    if (!ok) return;
    await sendRawToShop(file);
  };

  const handleSendToShopFromModal = async () => {
    const ok = await askConfirm({
      title: "Send photo to shopkeeper?",
      message: "The shop will read your handwritten list and prepare a bill manually. You won't add items here.",
      confirmText: "Send to shop",
      cancelText: "Stay here",
      danger: false,
    });
    if (!ok) return;
    const sent = await sendRawToShop(lastFile);
    if (sent) {
      setExtractedItems(null);
      setLastFile(null);
    }
  };

  const handleConfirmAdd = (chosen) => {
    if (!onAddToCart) return;
    chosen.forEach(({ product, qty }) => {
      for (let i = 0; i < qty; i++) onAddToCart(product);
    });
    setExtractedItems(null);
    toast(`Added ${chosen.reduce((s, c) => s + c.qty, 0)} item${chosen.length === 1 ? '' : 's'} to cart!`);
  };

  return (
    <>
      <style>{`
        @keyframes pkio_parchi_spin { 100% { transform: rotate(360deg); } }
        .pkio-parchi-spinner { width: 44px; height: 44px; border-radius: 50%; border: 4px solid #e2e8f0; border-top-color: #16a34a; animation: pkio_parchi_spin 0.9s linear infinite; }
      `}</style>

      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      <div style={{ background: 'linear-gradient(135deg, #ff6b6b, #ff4757)', borderRadius: '16px', padding: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', boxShadow: '0 4px 12px rgba(255, 71, 87, 0.25)', color: 'white' }}>
        <div style={{ flex: 1, paddingRight: '10px', textAlign: 'left' }}>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.15rem', fontWeight: '800' }}>Have a list? Upload Parchi</h3>
          <p style={{ margin: '0 0 14px 0', fontSize: '0.8rem', opacity: '0.95', lineHeight: '1.4' }}>
            Snap your handwritten list — AI reads it and adds matching items to your cart.
          </p>
          <button onClick={handleUploadClick} style={{ backgroundColor: '#ffffff', color: '#ff4757', border: 'none', borderRadius: '8px', padding: '10px 16px', fontWeight: 'bold', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
              <circle cx="12" cy="13" r="4"></circle>
            </svg>
            Upload Now
          </button>
        </div>
        <div style={{ fontSize: '4rem', lineHeight: '1', transform: 'rotate(8deg)' }}>🧾</div>
      </div>

      {isExtracting && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', zIndex: 2147483646, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ backgroundColor: 'white', padding: '30px 28px', borderRadius: '20px', textAlign: 'center', width: '85%', maxWidth: '320px', boxShadow: '0 20px 40px rgba(0,0,0,0.25)' }}>
            <div className="pkio-parchi-spinner" style={{ margin: '0 auto 18px auto' }} />
            <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.1rem' }}>Reading your parchi…</h3>
            <p style={{ color: '#64748b', fontSize: '0.88rem', marginTop: '8px', lineHeight: 1.5 }}>
              AI is matching each item to products in this shop.
            </p>
          </div>
        </div>
      )}

      <ParchiReviewModal
        isOpen={extractedItems !== null}
        items={extractedItems || []}
        onClose={() => setExtractedItems(null)}
        onConfirm={handleConfirmAdd}
        onSendToShop={handleSendToShopFromModal}
        sendingToShop={sendingToShop}
      />
    </>
  );
}

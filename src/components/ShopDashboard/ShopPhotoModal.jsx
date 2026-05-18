import React, { useEffect, useRef, useState } from 'react';
import { useToast } from '../../ui/DialogProvider.jsx';
import { cdnImage } from '../../utils/cloudinaryUrl.js';
import StorefrontIcon from '../../ui/StorefrontIcon.jsx';
import { shopFetch } from '../../utils/api.js';

const compressImage = (file, maxSize = 1200) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(new Error('Could not read file'));
  reader.readAsDataURL(file);
  reader.onload = (event) => {
    const img = new Image();
    img.onerror = () => reject(new Error('Could not decode image'));
    img.src = event.target.result;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      if (width > height) {
        if (width > maxSize) { height *= maxSize / width; width = maxSize; }
      } else {
        if (height > maxSize) { width *= maxSize / height; height = maxSize; }
      }
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        resolve(new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg', lastModified: Date.now() }));
      }, 'image/jpeg', 0.88);
    };
  };
});

export default function ShopPhotoModal({ open, onClose, shop, onShopUpdated }) {
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => {
    if (!open) {
      // Revoke any leftover blob URL so we don't leak ~1 MB per opened-and-closed cycle.
      if (preview && preview.startsWith('blob:')) {
        try { URL.revokeObjectURL(preview); } catch {}
      }
      setPreview(null);
      setPendingFile(null);
      setUploading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Final cleanup on unmount.
  useEffect(() => () => {
    if (preview && preview.startsWith('blob:')) {
      try { URL.revokeObjectURL(preview); } catch {}
    }
  }, [preview]);

  if (!open) return null;

  const initial = (shop?.name || '?').trim().charAt(0).toUpperCase();
  const currentImage = shop?.shopImage ? cdnImage(shop.shopImage, 800) : null;
  const displayImage = preview || currentImage;

  const handlePick = () => fileInputRef.current?.click();

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast('Please pick an image file.', 'error');
      return;
    }
    try {
      const compressed = await compressImage(file);
      const url = URL.createObjectURL(compressed);
      // Revoke the previous preview before swapping — the old blob URL would
      // otherwise stay alive in memory until the page reloaded.
      if (preview && preview.startsWith('blob:')) {
        try { URL.revokeObjectURL(preview); } catch {}
      }
      setPreview(url);
      setPendingFile(compressed);
    } catch (err) {
      console.error(err);
      toast('Could not read that image.', 'error');
    }
  };

  const handleUpload = async () => {
    if (!pendingFile || !shop?._id) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('shopImage', pendingFile);
      const res = await shopFetch(shop, `/shops/${shop._id}/upload-image`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Upload failed');
      }
      const updatedShop = await res.json();
      toast('Shop photo updated!');
      // server response strips sessionToken — preserve the in-memory one so the
      // shop stays logged in after the photo is replaced.
      if (onShopUpdated) onShopUpdated({ ...updatedShop, sessionToken: shop.sessionToken });
      onClose();
    } catch (err) {
      console.error(err);
      toast(err.message || 'Could not upload. Try again.', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15,23,42,0.55)',
        backdropFilter: 'blur(4px)',
        zIndex: 2147483646,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
      onClick={() => { if (!uploading) onClose(); }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: '20px',
          padding: '22px 20px 20px',
          width: '100%',
          maxWidth: '380px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#16a34a', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
              Shop photo
            </div>
            <h3 style={{ margin: '2px 0 0', fontSize: '1.2rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.3px' }}>
              Make a great first impression
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={uploading}
            aria-label="Close"
            style={{
              border: 'none', background: '#f1f5f9', color: '#475569',
              width: '32px', height: '32px', borderRadius: '50%',
              fontSize: '1rem', fontWeight: 800,
              cursor: uploading ? 'not-allowed' : 'pointer',
              opacity: uploading ? 0.5 : 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Preview */}
        <div style={{
          width: '100%', aspectRatio: '4 / 3',
          borderRadius: '16px',
          overflow: 'hidden',
          background: '#f1f5f9',
          border: '1px solid #e2e8f0',
          marginBottom: '12px',
          position: 'relative',
        }}>
          {displayImage ? (
            <img
              src={displayImage}
              alt={shop?.name || 'Shop'}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              background: 'linear-gradient(135deg, #dcfce7 0%, #86efac 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                width: '92px', height: '92px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.9)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 6px 18px rgba(22,163,74,0.25)',
                position: 'relative',
              }}>
                <span style={{ fontSize: '2.4rem', fontWeight: 900, color: '#15803d', lineHeight: 1 }}>{initial}</span>
                <span style={{
                  position: 'absolute', bottom: '-4px', right: '-4px',
                  background: '#16a34a', borderRadius: '50%', padding: '6px',
                  boxShadow: '0 2px 6px rgba(22,163,74,0.35)',
                }}>
                  <StorefrontIcon size={18} color="#fff" accent="#bbf7d0" />
                </span>
              </div>
            </div>
          )}

          {preview && (
            <div style={{
              position: 'absolute', top: '10px', right: '10px',
              background: 'rgba(15,23,42,0.78)', color: '#fff',
              padding: '4px 10px', borderRadius: '999px',
              fontSize: '0.66rem', fontWeight: 800, letterSpacing: '0.4px',
            }}>
              NEW · NOT SAVED
            </div>
          )}
        </div>

        <div style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 600, marginBottom: '14px', lineHeight: 1.4 }}>
          Customers see this photo on the Nearby tab. Use a clear, well-lit photo of your storefront.
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={handlePick}
            disabled={uploading}
            style={{
              width: '100%', padding: '14px',
              background: preview ? '#f1f5f9' : '#0f172a',
              color: preview ? '#0f172a' : '#fff',
              border: 'none', borderRadius: '12px',
              fontWeight: 800, fontSize: '0.95rem',
              cursor: uploading ? 'not-allowed' : 'pointer',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              opacity: uploading ? 0.6 : 1,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            {preview ? 'Choose a different photo' : (currentImage ? 'Replace photo' : 'Choose photo')}
          </button>

          <button
            onClick={handleUpload}
            disabled={!pendingFile || uploading}
            style={{
              width: '100%', padding: '14px',
              background: pendingFile && !uploading ? '#16a34a' : '#94a3b8',
              color: '#fff',
              border: 'none', borderRadius: '12px',
              fontWeight: 900, fontSize: '0.98rem',
              cursor: pendingFile && !uploading ? 'pointer' : 'not-allowed',
              boxShadow: pendingFile && !uploading ? '0 8px 20px rgba(22,163,74,0.30)' : 'none',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'background 0.15s',
            }}
          >
            {uploading ? 'Uploading…' : 'Save photo'}
          </button>
        </div>
      </div>
    </div>
  );
}

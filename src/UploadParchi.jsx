import React, { useState, useRef } from 'react';

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
        const MAX_SIZE = 800;

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
        }, 'image/jpeg', 0.7);
      };
    };
  });
};

export default function UploadParchi() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState("");
  
  const fileInputRef = useRef(null);
  const BASE_URL = "https://darkslategrey-snail-415133.hostingersite.com";

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const originalFile = e.target.files[0];
    if (!originalFile) return;

    setIsUploading(true);
    setUploadSuccess(false);
    setUploadError("");

    try {
      const compressedFile = await compressImage(originalFile);

      const formData = new FormData();
      formData.append("parchiImage", compressedFile); 
      
      const savedUser = JSON.parse(localStorage.getItem("packitout_user") || "{}");
      formData.append("customerName", savedUser.name || "Guest Customer");
      formData.append("userId", savedUser._id || "guest_id");
      
      const shopId = savedUser.primaryShop?._id || savedUser.primaryShop || "Master_Shop";
      formData.append("shopId", shopId);

      const res = await fetch(`${BASE_URL}/upload-parchi`, {
        method: "POST",
        body: formData, 
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsUploading(false);
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3500); 
      } else {
        throw new Error(data.error || "Upload failed");
      }
    } catch (err) {
      console.error(err);
      setIsUploading(false);
      setUploadError("Oops! Failed to send Parchi. Please try again.");
      setTimeout(() => setUploadError(""), 4000);
    }

    e.target.value = null; 
  };

  return (
    <>
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .spinner { animation: spin 1.5s linear infinite; display: inline-block; }
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
          <p style={{ margin: '0 0 14px 0', fontSize: '0.8rem', opacity: '0.95', lineHeight: '1.4' }}>Save time! Send a photo of your handwritten list and we'll pack it instantly.</p>
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

      {(isUploading || uploadSuccess || uploadError) && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', textAlign: 'center', width: '80%', maxWidth: '320px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            
            {isUploading && (
              <>
                <div className="spinner" style={{ fontSize: '3rem', marginBottom: '15px' }}>⏳</div>
                <h3 style={{ margin: 0, color: '#0f172a' }}>Uploading Parchi...</h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '10px' }}>Securely sending your list to the shopkeeper.</p>
              </>
            )}
            
            {uploadSuccess && (
              <>
                <div style={{ fontSize: '3.5rem', marginBottom: '15px' }}>✅</div>
                <h3 style={{ margin: 0, color: '#10b981' }}>Parchi Sent!</h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '10px' }}>The shopkeeper received your list. They will start packing your items shortly!</p>
              </>
            )}

            {uploadError && (
              <>
                <div style={{ fontSize: '3.5rem', marginBottom: '15px' }}>❌</div>
                <h3 style={{ margin: 0, color: '#ef4444' }}>Upload Failed</h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '10px' }}>{uploadError}</p>
                <button onClick={() => setUploadError("")} style={{ marginTop: '15px', padding: '8px 16px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer' }}>Close</button>
              </>
            )}

          </div>
        </div>
      )}
    </>
  );
                     }

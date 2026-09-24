import React, { useState, useEffect } from 'react';
import { useToast } from '../../ui/DialogProvider.jsx';

const BASE_URL = (import.meta.env.VITE_API_BASE || "https://darkslategrey-snail-415133.hostingersite.com");

export default function RequestItemModal({ user, onClose }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [shops, setShops] = useState([]);
  
  useEffect(() => {
    fetch(`${BASE_URL}/shops/all/${user.pincode}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setShops(data);
      })
      .catch(console.error);
  }, [user.pincode]);

  const [formData, setFormData] = useState({
    productName: '',
    brand: '',
    shopId: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.productName.trim()) {
      return toast("Please enter a product name", "warn");
    }
    
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/product-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.sessionToken}`
        },
        body: JSON.stringify({
          ...formData,
          pincode: user.pincode
        })
      });
      
      if (!res.ok) {
        throw new Error("Failed to submit request");
      }
      
      toast("Request submitted! Shops near you have been notified.", "success");
      onClose();
    } catch (err) {
      console.error(err);
      toast("Error submitting request", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100000, display: 'flex', justifyContent: 'center', alignItems: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div style={{ width: '100%', maxWidth: '600px', backgroundColor: '#fff', borderRadius: '24px 24px 0 0', padding: '24px', boxShadow: '0 -10px 40px rgba(0,0,0,0.1)', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '900', color: '#0f172a' }}>Request a Product</h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>Can't find what you need? Tell us!</p>
          </div>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '18px', fontSize: '1.2rem', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '800', color: '#334155' }}>Product Name <span style={{color:'#ef4444'}}>*</span></label>
            <input 
              type="text" 
              placeholder="e.g. Amul Taaza Milk 500ml" 
              value={formData.productName} 
              onChange={e => setFormData({ ...formData, productName: e.target.value })} 
              style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '1rem', outline: 'none' }}
              disabled={loading}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '800', color: '#334155' }}>Brand (Optional)</label>
            <input 
              type="text" 
              placeholder="e.g. Amul, Britannia" 
              value={formData.brand} 
              onChange={e => setFormData({ ...formData, brand: e.target.value })} 
              style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '1rem', outline: 'none' }}
              disabled={loading}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '800', color: '#334155' }}>Which Shop? (Optional)</label>
            <select
              value={formData.shopId}
              onChange={e => setFormData({ ...formData, shopId: e.target.value })}
              style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '1rem', outline: 'none' }}
              disabled={loading}
            >
              <option value="">Any shop in {user.pincode}</option>
              {shops.map(shop => (
                <option key={shop._id} value={shop._id}>{shop.name}</option>
              ))}
            </select>
          </div>

          <div style={{ backgroundColor: '#f0fdf4', padding: '12px', borderRadius: '12px', border: '1px solid #bbf7d0', color: '#166534', fontSize: '0.85rem', fontWeight: '600' }}>
            📍 This request will be sent to {formData.shopId ? "the selected shop" : `shops near ${user.pincode}`}. You will be notified when it's added.
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ width: '100%', padding: '16px', marginTop: '10px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '14px', fontWeight: '900', fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, boxShadow: '0 4px 14px rgba(22,163,74,0.3)' }}
          >
            {loading ? 'Submitting...' : 'Send Request'}
          </button>
        </form>

      </div>
    </div>
  );
}

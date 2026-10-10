import React, { useState, useEffect } from 'react';
import { useBaskets } from './utils/useBaskets';
import { cdnImage } from './utils/cloudinaryUrl';
import { useToast } from './ui/DialogProvider';
import { BASE_URL } from './utils/api';

export default function SharedBasketView({ basketId }) {
  const [basket, setBasket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { baskets, saveBaskets } = useBaskets();
  const toast = useToast();

  useEffect(() => {
    const fetchBasket = async () => {
      try {
        const res = await fetch(`${BASE_URL}/shared-baskets/${basketId}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setBasket(data);
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchBasket();
  }, [basketId]);

  const handleImport = () => {
    const id = Date.now().toString();
    const newBasket = {
      id,
      name: basket.name || 'Imported Basket',
      emoji: basket.emoji || '🧺',
      items: basket.items || [],
      reminderDays: 0,
      lastOrderedAt: null
    };
    saveBaskets([...baskets, newBasket]);
    toast(`"${newBasket.name}" saved to your baskets!`, "success");
    window.location.hash = "#baskets";
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', fontSize: '1.2rem', color: '#64748b' }}>⏳ Loading shared basket...</div>;
  }

  if (error || !basket) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>😕</div>
        <h2 style={{ fontSize: '1.4rem', color: '#0f172a', marginBottom: '8px' }}>Basket Not Found</h2>
        <p style={{ color: '#64748b', marginBottom: '24px' }}>This link might have expired or doesn't exist.</p>
        <button onClick={() => window.location.hash = ""} style={{ padding: '12px 24px', background: '#0f172a', color: '#fff', borderRadius: '12px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Go Home</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', paddingBottom: '100px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px', paddingTop: '20px' }}>
        <div style={{ fontSize: '4rem', marginBottom: '12px' }}>{basket.emoji || '🧺'}</div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', margin: '0 0 8px 0' }}>{basket.name}</h1>
        <div style={{ color: '#64748b', fontWeight: 600 }}>Someone shared this basket with you!</div>
      </div>

      <div style={{ backgroundColor: '#fff', borderRadius: '24px', padding: '20px', boxShadow: '0 10px 40px rgba(15,23,42,0.05)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', marginBottom: '16px' }}>{basket.items.length} Items</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {basket.items.map((item, idx) => (
            <div key={item._id || idx} style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '12px', background: '#f8fafc', borderRadius: '16px' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '12px', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                {item.image ? <img src={cdnImage(item.image, 150)} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <span>📦</span>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem', marginBottom: '4px' }}>{item.name}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ color: '#16a34a', fontWeight: 800, fontSize: '0.85rem' }}>₹{item.sellingPrice || item.mrp}</div>
                  <div style={{ color: '#64748b', fontWeight: 600, fontSize: '0.85rem' }}>Qty: {item.qty || 1}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '20px', backgroundColor: '#fff', borderTop: '1px solid #e2e8f0', boxShadow: '0 -10px 40px rgba(0,0,0,0.05)', zIndex: 100 }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => window.location.hash = ""}
            style={{ padding: '16px 20px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '16px', fontWeight: 900, fontSize: '1rem', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button 
            onClick={handleImport}
            style={{ flex: 1, padding: '16px 20px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '16px', fontWeight: 900, fontSize: '1rem', cursor: 'pointer' }}
          >
            Import to My Baskets
          </button>
        </div>
      </div>
    </div>
  );
}

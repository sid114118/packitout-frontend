import React, { useState, useEffect } from 'react';
import { useToast } from '../ui/DialogProvider.jsx';
import { useBaskets } from '../utils/useBaskets.js';

const EMOJIS = ['❤️','🛒','🌶️','🥛','🍞','🍗','🧼','🍪','🍎','🥦'];

export default function BasketDrawer() {
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [product, setProduct] = useState(null);
  
  const { baskets, saveBaskets } = useBaskets();
  
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('🛒');

  useEffect(() => {
    const handleOpen = (e) => {
      setProduct(e.detail);
      setIsOpen(true);
      setIsCreating(false);
      setNewName('');
      setNewEmoji('🛒');
    };

    window.addEventListener('OPEN_BASKET_DRAWER', handleOpen);
    return () => window.removeEventListener('OPEN_BASKET_DRAWER', handleOpen);
  }, []);

  const handleToggleBasket = (basketId) => {
    let wasRemoved = false;
    const newBaskets = baskets.map(b => {
      if (b.id === basketId) {
        if (b.items.some(i => i._id === product._id)) {
          wasRemoved = true;
          return { ...b, items: b.items.filter(i => i._id !== product._id) };
        }
        return { ...b, items: [...b.items, { ...product, qty: 1 }] };
      }
      return b;
    });
    saveBaskets(newBaskets);
    toast(wasRemoved ? `Removed from basket` : `Added to basket!`, "success");
    if (!wasRemoved) setIsOpen(false);
  };

  const handleCreateNew = () => {
    if (!newName.trim()) {
      toast("Please enter a name", "error");
      return;
    }
    const newBaskets = [
      ...baskets, 
      { id: Date.now().toString(), name: newName.trim(), emoji: newEmoji, items: [{ ...product, qty: 1 }], reminderDays: 0, lastOrderedAt: null }
    ];
    saveBaskets(newBaskets);
    setIsOpen(false);
    toast(`Created new basket and added item!`, "success");
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        onClick={() => setIsOpen(false)}
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.4)', zIndex: 99999999, backdropFilter: 'blur(2px)' }} 
      />
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px', zIndex: 100000000, boxShadow: '0 -10px 40px rgba(0,0,0,0.1)', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>
            {isCreating ? 'New Basket' : 'Save to Basket'}
          </h3>
          <button onClick={() => { isCreating ? setIsCreating(false) : setIsOpen(false); }} style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', fontSize: '1rem', fontWeight: 800, color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isCreating ? '←' : '✕'}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#fff', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0' }}>
            {product?.image ? <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '1.2rem' }}>{product?.emoji || '🛒'}</span>}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product?.name}</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>₹{product?.sellingPrice || product?.mrp}</div>
          </div>
        </div>

        {isCreating ? (
          <div style={{ marginBottom: '20px' }}>
            <input 
              autoFocus
              type="text" 
              placeholder="e.g. Monthly Groceries" 
              value={newName}
              onChange={e => setNewName(e.target.value)}
              style={{ width: '100%', padding: '14px', fontSize: '1rem', border: '2px solid #e2e8f0', borderRadius: '12px', marginBottom: '16px', outline: 'none' }}
            />
            <div style={{ marginBottom: '8px', fontSize: '0.85rem', fontWeight: 800, color: '#64748b' }}>Choose an Icon:</div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '24px' }}>
              {EMOJIS.map(em => (
                <button 
                  key={em} 
                  onClick={() => setNewEmoji(em)}
                  style={{ fontSize: '1.5rem', background: newEmoji === em ? '#dcfce7' : '#f8fafc', border: newEmoji === em ? '2px solid #22c55e' : '2px solid transparent', borderRadius: '12px', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {em}
                </button>
              ))}
            </div>
            <button onClick={handleCreateNew} disabled={!newName.trim()} style={{ width: '100%', padding: '16px', backgroundColor: newName.trim() ? '#16a34a' : '#94a3b8', color: '#fff', border: 'none', borderRadius: '16px', fontSize: '1rem', fontWeight: 800, cursor: newName.trim() ? 'pointer' : 'not-allowed' }}>
              Create & Save Item
            </button>
          </div>
        ) : (
          <>
            <div style={{ maxHeight: '40vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {baskets.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem', padding: '10px 0' }}>No baskets yet. Create one below!</div>
              ) : (
                baskets.map(b => {
                  const alreadyHas = b.items.some(i => i._id === product._id);
                  return (
                    <button 
                      key={b.id} 
                      onClick={() => handleToggleBasket(b.id)}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: alreadyHas ? '#f1f5f9' : '#fff', border: '2px solid ' + (alreadyHas ? '#e2e8f0' : '#16a34a'), borderRadius: '16px', cursor: 'pointer' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: alreadyHas ? 0.6 : 1 }}>
                        <span style={{ fontSize: '1.5rem' }}>{b.emoji || '🛒'}</span>
                        <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>{b.name}</span>
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: alreadyHas ? '#ef4444' : '#16a34a', padding: '6px 12px', borderRadius: '8px', backgroundColor: alreadyHas ? '#fee2e2' : 'transparent' }}>
                        {alreadyHas ? "Remove" : "Save"}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            <button onClick={() => setIsCreating(true)} style={{ width: '100%', padding: '16px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: '16px', fontSize: '1rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span>+</span> Create New Basket
            </button>
          </>
        )}
      </div>
    </>
  );
}

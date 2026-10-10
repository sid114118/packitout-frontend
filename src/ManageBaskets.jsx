import React, { useState, useEffect } from 'react';
import { useToast, useConfirm } from './ui/DialogProvider.jsx';
import { useBaskets } from './utils/useBaskets.js';
import { cdnImage } from './utils/cloudinaryUrl.js';

const EMOJIS = ['❤️','🛒','🌶️','🥛','🍞','🍗','🧼','🍪','🍎','🥦'];

export default function ManageBaskets({ onBack, onAddToCart, cart, setCart }) {
  const toast = useToast();
  const confirmDialog = useConfirm();
  const { baskets, saveBaskets } = useBaskets();
  
  const [viewingBasketId, setViewingBasketId] = useState(null);

  useEffect(() => {
    const focus = localStorage.getItem('packitout_focus_basket');
    if (focus) {
      setViewingBasketId(focus);
      localStorage.removeItem('packitout_focus_basket');
    }
  }, []);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmoji, setEditEmoji] = useState('');

  const [checkoutBasketId, setCheckoutBasketId] = useState(null);
  const [showCustomReminder, setShowCustomReminder] = useState(false);
  const [customReminderDays, setCustomReminderDays] = useState('');

  const handleShareBasket = async (basket) => {
    try {
      const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const userRaw = localStorage.getItem('packitout_user');
      const user = userRaw ? JSON.parse(userRaw) : null;
      if (!user || !user.sessionToken) return toast("Please log in to share baskets.", "error");
      const token = user.sessionToken;
      
      toast("Preparing share link...");
      const res = await fetch(`${BASE_URL}/shared-baskets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: basket.name, emoji: basket.emoji, items: basket.items })
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      
      const shareUrl = `${window.location.origin}/#/shared-basket/${data.id}`;
      const shareData = {
        title: `PackItOut Basket: ${basket.name}`,
        text: `Check out my ${basket.name} basket on PackItOut!`,
        url: shareUrl
      };
      
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        const text = encodeURIComponent(`${shareData.text} ${shareData.url}`);
        window.open(`https://wa.me/?text=${text}`, '_blank');
      }
    } catch (err) {
      toast("Failed to share basket.", "error");
    }
  };

  const handleCreateNew = () => {
    const id = Date.now().toString();
    const newBaskets = [...baskets, { id, name: 'New Basket', emoji: '🛒', items: [], reminderDays: 0, lastOrderedAt: null }];
    saveBaskets(newBaskets);
    setViewingBasketId(id);
    startEditing({ id, name: 'New Basket', emoji: '🛒' });
  };

  const startEditing = (basket) => {
    setIsEditing(true);
    setEditName(basket.name);
    setEditEmoji(basket.emoji || '🛒');
  };

  const saveEdit = () => {
    if (!editName.trim()) {
      toast("Name cannot be empty", "error");
      return;
    }
    const newBaskets = baskets.map(b => b.id === viewingBasketId ? { ...b, name: editName.trim(), emoji: editEmoji } : b);
    saveBaskets(newBaskets);
    setIsEditing(false);
  };

  const handleDelete = async (id, name) => {
    const ok = await confirmDialog({
      title: "Delete Basket",
      message: `Are you sure you want to delete '${name}'?`,
      confirmText: "Delete",
      danger: true
    });
    if (!ok) return;
    saveBaskets(baskets.filter(b => b.id !== id));
    setViewingBasketId(null);
    toast("Basket deleted");
  };

  const handleAdjustQty = (basketId, productId, delta) => {
    const newBaskets = baskets.map(b => {
      if (b.id === basketId) {
        return {
          ...b,
          items: b.items.map(i => {
            if (i._id === productId) {
              const newQty = Math.max(1, (i.qty || 1) + delta);
              return { ...i, qty: newQty };
            }
            return i;
          })
        };
      }
      return b;
    });
    saveBaskets(newBaskets);
  };

  const handleRemoveItem = (basketId, productId) => {
    const newBaskets = baskets.map(b => {
      if (b.id === basketId) {
        return { ...b, items: b.items.filter(i => i._id !== productId) };
      }
      return b;
    });
    saveBaskets(newBaskets);
  };

  const handleSetReminder = (id, days) => {
    const newBaskets = baskets.map(b => b.id === id ? { ...b, reminderDays: days } : b);
    saveBaskets(newBaskets);
    toast(days > 0 ? `Reminder set for ${days} days!` : "Reminder disabled");
  };

  const processCheckout = (basket, replaceCart) => {
    setCart(prev => {
      let newCart = replaceCart ? [] : [...prev];
      basket.items.forEach(item => {
        const qtyToAdd = item.qty || 1;
        const existing = newCart.find(i => i._id === item._id);
        if (existing) {
          existing.qty = (Number(existing.qty) || 0) + qtyToAdd;
        } else {
          newCart.push({
            _id: item._id,
            name: item.name,
            brand: item.brand,
            image: item.image,
            emoji: item.emoji,
            qnty: item.qnty,
            mrp: Number(item.mrp || 0),
            sellingPrice: Number(item.sellingPrice || item.mrp || 0),
            shopId: item.shopId || (newCart.length > 0 ? newCart[0].shopId : null),
            qty: qtyToAdd
          });
        }
      });
      return newCart;
    });

    const newBaskets = baskets.map(b => b.id === basket.id ? { ...b, lastOrderedAt: Date.now() } : b);
    saveBaskets(newBaskets);
    
    toast(`Added items to cart!`, "success");
    setCheckoutBasketId(null);
    window.location.hash = "#cart";
  };

  const handleCheckoutClick = (basket) => {
    if (basket.items.length === 0) {
      toast("This basket is empty!", "error");
      return;
    }
    if (cart && cart.length > 0) {
      setCheckoutBasketId(basket.id);
    } else {
      processCheckout(basket, false);
    }
  };

  const checkoutBasketObj = checkoutBasketId ? baskets.find(b => b.id === checkoutBasketId) : null;
  const viewingBasketObj = viewingBasketId ? baskets.find(b => b.id === viewingBasketId) : null;

  // Auto-reset if basket was deleted elsewhere or invalid
  useEffect(() => {
    if (viewingBasketId && !baskets.some(b => b.id === viewingBasketId)) {
      setViewingBasketId(null);
    }
  }, [viewingBasketId, baskets]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', paddingBottom: '100px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {checkoutBasketId && checkoutBasketObj && (
        <>
          <div onClick={() => setCheckoutBasketId(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.6)', zIndex: 99999, backdropFilter: 'blur(4px)' }} />
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px', zIndex: 100000, animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>You have items in your cart</h3>
            <p style={{ margin: '0 0 24px', fontSize: '0.9rem', color: '#64748b', lineHeight: 1.5 }}>Would you like to replace your current cart with this basket, or extend your current cart?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button onClick={() => processCheckout(checkoutBasketObj, true)} style={{ width: '100%', padding: '16px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '16px', fontSize: '1rem', fontWeight: 800, cursor: 'pointer' }}>
                Replace Cart
              </button>
              <button onClick={() => processCheckout(checkoutBasketObj, false)} style={{ width: '100%', padding: '16px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '16px', fontSize: '1rem', fontWeight: 800, cursor: 'pointer' }}>
                Add to Current Cart
              </button>
              <button onClick={() => setCheckoutBasketId(null)} style={{ width: '100%', padding: '16px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '16px', fontSize: '1rem', fontWeight: 800, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </>
      )}

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, backgroundColor: '#fff', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => viewingBasketId ? setViewingBasketId(null) : onBack()} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>
            {viewingBasketId ? 'Basket Details' : 'Manage Baskets'}
          </h1>
        </div>
        {!viewingBasketId && (
          <button onClick={handleCreateNew} style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '999px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}>
            + New
          </button>
        )}
      </div>

      <div style={{ padding: '20px' }}>
        {viewingBasketObj ? (
          <div style={{ animation: 'opFade 0.2s ease-out' }}>
            {/* Detailed View */}
            <div style={{ backgroundColor: '#fff', borderRadius: '24px', padding: '24px', boxShadow: '0 10px 40px rgba(15,23,42,0.05)', marginBottom: '20px' }}>
              {isEditing ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <span style={{ fontSize: '3rem' }}>{editEmoji}</span>
                    <input 
                      autoFocus
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      style={{ flex: 1, padding: '14px', fontSize: '1.2rem', fontWeight: 800, border: '2px solid #3b82f6', borderRadius: '12px', outline: 'none' }}
                    />
                  </div>
                  <div style={{ marginBottom: '8px', fontSize: '0.85rem', fontWeight: 800, color: '#64748b' }}>Choose an Icon:</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
                    {EMOJIS.map(em => (
                      <button key={em} onClick={() => setEditEmoji(em)} style={{ fontSize: '1.5rem', background: editEmoji === em ? '#dcfce7' : '#f8fafc', border: editEmoji === em ? '2px solid #22c55e' : '2px solid transparent', borderRadius: '12px', padding: '8px', cursor: 'pointer' }}>
                        {em}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={saveEdit} style={{ flex: 1, padding: '14px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '1rem', cursor: 'pointer' }}>Save</button>
                    <button onClick={() => setIsEditing(false)} style={{ flex: 1, padding: '14px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '1rem', cursor: 'pointer' }}>Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <div style={{ fontSize: '4rem', lineHeight: 1 }}>{viewingBasketObj.emoji || '🛒'}</div>
                      <div>
                        <h2 style={{ margin: '0 0 6px 0', fontSize: '1.6rem', fontWeight: 900, color: '#0f172a' }}>{viewingBasketObj.name}</h2>
                        <div style={{ fontSize: '0.95rem', color: '#64748b', fontWeight: 600 }}>
                          {viewingBasketObj.items.length} Items • <span style={{ color: '#16a34a', fontWeight: 800 }}>₹{viewingBasketObj.items.reduce((s, i) => s + (Number(i.sellingPrice || i.mrp) * (i.qty || 1)), 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleShareBasket(viewingBasketObj)} style={{ background: '#dbeafe', border: '1px solid #bfdbfe', color: '#1e3a8a', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 17 20 12 15 7"></polyline><path d="M4 18v-2a4 4 0 0 1 4-4h12"></path></svg>
                      </button>
                      <button onClick={() => startEditing(viewingBasketObj)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                      </button>
                    </div>
                  </div>

                  {viewingBasketObj.id !== 'favourites' && (
                    <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <span style={{ fontSize: '1.2rem' }}>🔔</span>
                        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>Reorder Reminder</span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                        {[{d:0, l:'Off'}, {d:7, l:'Weekly'}, {d:14, l:'Bi-weekly'}, {d:30, l:'Monthly'}].map(opt => (
                          <button 
                            key={opt.d}
                            onClick={() => { handleSetReminder(viewingBasketObj.id, opt.d); setShowCustomReminder(false); }}
                            style={{ flexShrink: 0, padding: '8px 16px', background: viewingBasketObj.reminderDays === opt.d && !showCustomReminder ? '#16a34a' : '#fff', color: viewingBasketObj.reminderDays === opt.d && !showCustomReminder ? '#fff' : '#64748b', border: viewingBasketObj.reminderDays === opt.d && !showCustomReminder ? 'none' : '1px solid #cbd5e1', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer' }}
                          >
                            {opt.l}
                          </button>
                        ))}
                        <button 
                          onClick={() => setShowCustomReminder(true)}
                          style={{ flexShrink: 0, padding: '8px 16px', background: showCustomReminder || (viewingBasketObj.reminderDays > 0 && ![7,14,30].includes(viewingBasketObj.reminderDays)) ? '#16a34a' : '#fff', color: showCustomReminder || (viewingBasketObj.reminderDays > 0 && ![7,14,30].includes(viewingBasketObj.reminderDays)) ? '#fff' : '#64748b', border: showCustomReminder || (viewingBasketObj.reminderDays > 0 && ![7,14,30].includes(viewingBasketObj.reminderDays)) ? 'none' : '1px solid #cbd5e1', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer' }}
                        >
                          {viewingBasketObj.reminderDays > 0 && ![7,14,30].includes(viewingBasketObj.reminderDays) && !showCustomReminder ? `${viewingBasketObj.reminderDays} Days` : 'Custom'}
                        </button>
                      </div>
                      
                      {showCustomReminder && (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', animation: 'fadeIn 0.2s ease' }}>
                          <input 
                            type="number" 
                            placeholder="Enter days (e.g. 45)" 
                            value={customReminderDays}
                            onChange={e => setCustomReminderDays(e.target.value)}
                            style={{ flex: 1, padding: '10px 16px', border: '1px solid #cbd5e1', borderRadius: '12px', fontSize: '0.95rem', outline: 'none' }}
                          />
                          <button 
                            onClick={() => {
                              const d = parseInt(customReminderDays);
                              if (!isNaN(d) && d > 0) {
                                handleSetReminder(viewingBasketObj.id, d);
                                setShowCustomReminder(false);
                                setCustomReminderDays('');
                              } else {
                                toast("Please enter a valid number of days", "error");
                              }
                            }}
                            style={{ padding: '10px 20px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}
                          >
                            Set
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', marginBottom: '12px', marginLeft: '4px' }}>Items ({viewingBasketObj.items.length})</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '100px' }}>
              {viewingBasketObj.items.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem', padding: '20px', background: '#fff', borderRadius: '16px' }}>This basket is empty. Browse products and tap the heart icon to add items!</div>
              ) : (
                viewingBasketObj.items.map(item => (
                  <div key={item._id} style={{ display: 'flex', backgroundColor: '#fff', padding: '16px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(15,23,42,0.03)', border: '1px solid #f1f5f9', gap: '16px', alignItems: 'center' }}>
                    <div style={{ width: '80px', height: '80px', flexShrink: 0, backgroundColor: '#f8fafc', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {item.image ? <img src={cdnImage(item.image, 200)} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <span style={{ fontSize: '2rem' }}>{item.emoji || '📦'}</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '4px' }}>{item.name}</div>
                      <div style={{ fontSize: '0.85rem', color: '#16a34a', fontWeight: 800, marginBottom: '12px' }}>₹{item.sellingPrice || item.mrp}</div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', borderRadius: '999px', border: '1px solid #e2e8f0' }}>
                          <button onClick={() => handleAdjustQty(viewingBasketObj.id, item._id, -1)} style={{ background: 'none', border: 'none', padding: '6px 12px', fontSize: '1.2rem', color: '#475569', cursor: 'pointer' }}>-</button>
                          <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', width: '20px', textAlign: 'center' }}>{item.qty || 1}</span>
                          <button onClick={() => handleAdjustQty(viewingBasketObj.id, item._id, 1)} style={{ background: 'none', border: 'none', padding: '6px 12px', fontSize: '1.2rem', color: '#475569', cursor: 'pointer' }}>+</button>
                        </div>
                        <button onClick={() => handleRemoveItem(viewingBasketObj.id, item._id)} style={{ background: '#fef2f2', color: '#ef4444', border: 'none', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '20px', backgroundColor: '#fff', borderTop: '1px solid #e2e8f0', boxShadow: '0 -10px 40px rgba(0,0,0,0.05)', zIndex: 90 }}>
              <button 
                onClick={() => handleCheckoutClick(viewingBasketObj)} 
                disabled={viewingBasketObj.items.length === 0} 
                style={{ width: '100%', padding: '16px', background: viewingBasketObj.items.length === 0 ? '#e2e8f0' : '#16a34a', color: viewingBasketObj.items.length === 0 ? '#94a3b8' : '#fff', border: 'none', borderRadius: '16px', fontWeight: 900, fontSize: '1.1rem', cursor: viewingBasketObj.items.length === 0 ? 'not-allowed' : 'pointer', boxShadow: viewingBasketObj.items.length === 0 ? 'none' : '0 8px 24px rgba(22, 163, 74, 0.3)' }}
              >
                Checkout Basket (₹{viewingBasketObj.items.reduce((s, i) => s + (Number(i.sellingPrice || i.mrp) * (i.qty || 1)), 0).toLocaleString()})
              </button>
              {viewingBasketObj.id !== 'favourites' && (
                <button 
                  onClick={() => handleDelete(viewingBasketObj.id, viewingBasketObj.name)} 
                  style={{ width: '100%', padding: '12px', background: 'transparent', color: '#94a3b8', border: 'none', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', marginTop: '8px' }}
                >
                  Delete this Basket
                </button>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', animation: 'opFade 0.2s ease-out' }}>
            {baskets.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', marginTop: '60px', color: '#64748b' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🛒</div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>No Saved Baskets</h2>
                <p style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>You haven't created any baskets yet. Tap the heart icon on any product to save it!</p>
              </div>
            ) : (
              baskets.map((basket, i) => {
                const colors = i % 2 === 0 ? { bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: 'rgba(59, 130, 246, 0.15)', text: '#1e3a8a', subtext: '#1e40af' } : { bg: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', border: 'rgba(239, 68, 68, 0.15)', text: '#7f1d1d', subtext: '#991b1b' };
                if (basket.id === 'favourites') {
                  colors.bg = 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)';
                  colors.border = 'rgba(225, 29, 72, 0.15)';
                  colors.text = '#881337';
                  colors.subtext = '#9f1239';
                }
                
                return (
                  <div 
                    key={basket.id} 
                    onClick={() => setViewingBasketId(basket.id)}
                    style={{ backgroundColor: '#fff', borderRadius: '24px', padding: '20px', background: colors.bg, border: '1px solid ' + colors.border, boxShadow: '0 8px 24px rgba(15,23,42,0.04)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '12px' }}
                  >
                    <div style={{ fontSize: '3rem', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))' }}>{basket.emoji || '🛒'}</div>
                    <div>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: 900, color: colors.text, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{basket.name}</h3>
                      <div style={{ fontSize: '0.8rem', color: colors.subtext, fontWeight: 700 }}>{basket.items.length} Items</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

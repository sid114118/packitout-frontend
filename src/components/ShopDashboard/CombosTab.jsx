import React, { useState } from 'react';
import { BASE_URL } from '../../utils/api';
import toast from 'react-hot-toast';

export default function CombosTab({ shopData, onComboRefresh }) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🎁');
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter shop inventory for search
  const availableItems = (shopData?.inventory || []).filter(i => i.inStock && i.product);
  const searchResults = searchTerm 
    ? availableItems.filter(i => (i.product.name || '').toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

  const handleToggleItem = (item) => {
    if (selectedItems.find(i => i.product._id === item.product._id)) {
      setSelectedItems(selectedItems.filter(i => i.product._id !== item.product._id));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const handleCreateCombo = async (e) => {
    e.preventDefault();
    if (selectedItems.length === 0) return toast('Please select at least 1 item', { icon: '⚠️' });
    if (!name) return toast('Please enter a combo name', { icon: '⚠️' });
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`${BASE_URL}/shops/${shopData._id}/combos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${shopData.sessionTokens?.[0]?.token}`
        },
        body: JSON.stringify({
          name,
          emoji,
          productIds: selectedItems.map(i => i.product._id)
        })
      });
      const data = await response.json();
      if (response.ok) {
        toast.success('Combo created!');
        setName('');
        setEmoji('🎁');
        setSelectedItems([]);
        setSearchTerm('');
        if (onComboRefresh) await onComboRefresh();
      } else {
        toast.error(data.error || 'Failed to create combo');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCombo = async (comboId) => {
    if (!window.confirm('Delete this combo?')) return;
    try {
      const response = await fetch(`${BASE_URL}/shops/${shopData._id}/combos/${comboId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${shopData.sessionTokens?.[0]?.token}`
        }
      });
      if (response.ok) {
        toast.success('Combo deleted');
        if (onComboRefresh) await onComboRefresh();
      } else {
        toast.error('Failed to delete');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  const currentCombos = shopData?.combos || [];

  return (
    <div style={{ paddingBottom: '30px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.3rem', fontWeight: '800', marginBottom: '20px' }}>🎁 Combo Offers</h3>
      
      <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '16px', padding: '20px', marginBottom: '30px' }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#b45309' }}>Create New Combo</h4>
        <form onSubmit={handleCreateCombo} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              placeholder="Emoji (e.g. 🪔)" 
              value={emoji} 
              onChange={e => setEmoji(e.target.value)} 
              style={{ width: '60px', padding: '12px', borderRadius: '10px', border: '1px solid #fcd34d', fontSize: '1.2rem', textAlign: 'center' }} 
            />
            <input 
              type="text" 
              placeholder="Combo Name (e.g. Diwali Dhamaka Box)" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              required
              style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #fcd34d', outline: 'none' }} 
            />
          </div>

          <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '10px', border: '1px solid #fef3c7' }}>
            <h5 style={{ margin: '0 0 10px 0', color: '#92400e' }}>Selected Items ({selectedItems.length})</h5>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: selectedItems.length > 0 ? '15px' : '0' }}>
              {selectedItems.map(item => (
                <div key={item.product._id} style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: '#fef3c7', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem' }}>
                  {item.product.name}
                  <button type="button" onClick={() => handleToggleItem(item)} style={{ background: 'none', border: 'none', color: '#b45309', cursor: 'pointer', padding: '0 4px', fontWeight: 'bold' }}>✕</button>
                </div>
              ))}
              {selectedItems.length === 0 && <span style={{ color: '#d97706', fontSize: '0.9rem' }}>No items selected yet.</span>}
            </div>

            <input 
              type="text" 
              placeholder="Search inventory to add items..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '10px' }} 
            />
            
            {searchTerm && searchResults.length > 0 && (
              <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                {searchResults.map(item => (
                  <div 
                    key={item.product._id} 
                    onClick={() => handleToggleItem(item)}
                    style={{ padding: '10px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', backgroundColor: selectedItems.find(i => i.product._id === item.product._id) ? '#f0fdf4' : '#fff' }}
                  >
                    <span>{item.product.name}</span>
                    <span style={{ fontWeight: 'bold', color: '#16a34a' }}>₹{item.sellingPrice}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            style={{ padding: '14px', backgroundColor: '#d97706', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: isSubmitting ? 'wait' : 'pointer' }}
          >
            {isSubmitting ? 'Creating...' : 'Launch Combo'}
          </button>
        </form>
      </div>

      <h4 style={{ color: '#334155', marginBottom: '15px' }}>Your Active Combos ({currentCombos.length})</h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
        {currentCombos.map(combo => (
          <div key={combo._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <div>
              <h4 style={{ margin: '0 0 5px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>{combo.emoji}</span> {combo.name}
              </h4>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>{combo.productIds?.length || 0} items included</p>
            </div>
            <button 
              onClick={() => handleDeleteCombo(combo._id)}
              style={{ backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', padding: '8px 12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Delete
            </button>
          </div>
        ))}
        {currentCombos.length === 0 && (
          <div style={{ padding: '30px', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '12px', color: '#64748b' }}>
            No combos active yet. Create one above!
          </div>
        )}
      </div>
    </div>
  );
}

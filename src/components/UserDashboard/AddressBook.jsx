import React from 'react';

export default function AddressBook({ 
  addresses, 
  showAddressForm, 
  setShowAddressForm, 
  newAddress, 
  setNewAddress, 
  handleSaveAddress 
}) {
  return (
    <div style={{ marginBottom: '25px' }}>
      
      {/* Header & Add Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h3 style={{ color: '#334155', fontSize: '1.1rem', margin: 0 }}>My Addresses</h3>
        <button 
          onClick={() => setShowAddressForm(!showAddressForm)} 
          style={{ color: '#10b981', background: 'none', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
        >
          {showAddressForm ? "Cancel" : "+ Add New"}
        </button>
      </div>

      {/* New Address Form */}
      {showAddressForm && (
        <form onSubmit={handleSaveAddress} style={{ background: 'white', padding: '15px', borderRadius: '12px', marginBottom: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
          <input 
            type="text" 
            placeholder="Flat, House no., Building, Landmark" 
            value={newAddress} 
            onChange={e => setNewAddress(e.target.value)} 
            style={{ ...inputStyle, marginBottom: '10px' }} 
            required 
          />
          <button type="submit" style={{ width: '100%', padding: '10px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
            Save Address
          </button>
        </form>
      )}

      {/* Horizontal List of Saved Addresses */}
      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
        {addresses.map((addr) => (
          <div key={addr.id} style={{ minWidth: '200px', background: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0' }}>
            <strong style={{ color: '#0f172a', display: 'block', marginBottom: '5px' }}>{addr.label}</strong>
            <span style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: '1.4' }}>{addr.detail}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Keeping the styling self-contained
const inputStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', outline: 'none' };

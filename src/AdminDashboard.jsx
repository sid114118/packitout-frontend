import React from 'react';

export default function AdminDashboard({ onExit }) {
  return (
    <div style={{ backgroundColor: '#0f172a', minHeight: '100vh', color: '#f8fafc', padding: '20px', fontFamily: 'sans-serif' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '15px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#38bdf8' }}>⚙️ Command Center</h1>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Super Admin Authority</span>
        </div>
        <button 
          onClick={onExit}
          style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold' }}
        >
          Exit Admin
        </button>
      </div>

      {/* 1. TOP STATS ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
        <div style={{ backgroundColor: '#1e293b', padding: '15px', borderRadius: '12px', borderLeft: '4px solid #38bdf8' }}>
          <p style={{ margin: '0 0 5px 0', fontSize: '0.8rem', color: '#cbd5e1' }}>TODAY'S ORDERS</p>
          <h2 style={{ margin: 0, fontSize: '1.8rem' }}>42</h2>
        </div>
        <div style={{ backgroundColor: '#1e293b', padding: '15px', borderRadius: '12px', borderLeft: '4px solid #10b981' }}>
          <p style={{ margin: '0 0 5px 0', fontSize: '0.8rem', color: '#cbd5e1' }}>MONTHLY REVENUE</p>
          <h2 style={{ margin: 0, fontSize: '1.8rem' }}>₹12.4K</h2>
        </div>
        <div style={{ backgroundColor: '#1e293b', padding: '15px', borderRadius: '12px', borderLeft: '4px solid #f59e0b', gridColumn: 'span 2' }}>
          <p style={{ margin: '0 0 5px 0', fontSize: '0.8rem', color: '#cbd5e1' }}>🏆 TOP PERFORMING SHOP</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Sharma Groceries</h2>
            <span style={{ backgroundColor: '#fcf6bd', color: '#b45309', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>110001</span>
          </div>
        </div>
      </div>

      {/* 2. QUICK ACTIONS */}
      <h3 style={{ fontSize: '1.1rem', marginBottom: '15px', color: '#94a3b8' }}>Quick Actions</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '30px' }}>
        <button style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '15px', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
          <span>🏪 Add New Shop</span> <span>+</span>
        </button>
        <button style={{ backgroundColor: '#8b5cf6', color: 'white', border: 'none', padding: '15px', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
          <span>📍 Open New Pincode</span> <span>+</span>
        </button>
        <button style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '15px', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
          <span>📦 Add Master Product</span> <span>+</span>
        </button>
      </div>

      {/* 3. LIVE ORDER MONITORING */}
      <h3 style={{ fontSize: '1.1rem', marginBottom: '15px', color: '#94a3b8' }}>Live Order Feed</h3>
      <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '15px' }}>
        <div style={{ borderBottom: '1px solid #334155', paddingBottom: '12px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span style={{ fontWeight: 'bold' }}>Order #1042</span>
            <span style={{ backgroundColor: '#fef08a', color: '#854d0e', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>PENDING</span>
          </div>
          <p style={{ margin: '0 0 5px 0', fontSize: '0.85rem', color: '#cbd5e1' }}>Demo User • 3 Items (₹378)</p>
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#ef4444' }}>Shop: Sharma Groceries (Waiting 4 mins)</p>
        </div>
      </div>

    </div>
  );
}

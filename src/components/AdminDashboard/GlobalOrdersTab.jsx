import React from 'react';

export default function GlobalOrdersTab({ orders }) {
  return (
    <div style={cardStyle}>
      <h3 style={{ marginTop: 0 }}>Global Order Pulse ({orders.length})</h3>
      <table style={tableStyle}>
        <thead>
          <tr style={tableHeaderStyle}>
            <th>Order ID</th><th>Customer</th><th>Shop</th><th>Amount</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(o => (
            <tr key={o._id} style={{ borderBottom: '1px solid #f8fafc' }}>
              <td style={{ padding: '10px', fontSize: '0.9rem', color: '#64748b' }}>...{o._id.slice(-6)}</td>
              <td style={{ padding: '10px' }}><strong>{o.userId?.name || "Unknown"}</strong></td>
              <td style={{ padding: '10px' }}>{o.shopId?.name || "Unknown"}</td>
              <td style={{ padding: '10px', fontWeight: 'bold' }}>₹{o.totalAmount}</td>
              <td style={{ padding: '10px' }}>
                <span style={{ 
                  padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', 
                  backgroundColor: o.status === 'Delivered ✅' ? '#d1fae5' : '#fef3c7', 
                  color: o.status === 'Delivered ✅' ? '#059669' : '#b45309' 
                }}>
                  {o.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Styling Helpers
const cardStyle = { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' };
const tableStyle = { width: '100%', borderCollapse: 'collapse', textAlign: 'left' };
const tableHeaderStyle = { backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase' };

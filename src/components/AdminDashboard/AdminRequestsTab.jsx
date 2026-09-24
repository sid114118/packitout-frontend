import React, { useState, useEffect } from 'react';
import { adminFetch } from '../../utils/api.js';

export default function AdminRequestsTab() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await adminFetch('/admin/product-requests');
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', color: '#64748b' }}>Loading requests...</div>;

  return (
    <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
      <h3 style={{ padding: '20px', margin: 0, borderBottom: '1px solid #e2e8f0', color: '#0f172a', fontWeight: '900' }}>User Product Requests</h3>
      
      {requests.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No requests yet.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', color: '#475569' }}>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>Product Name</th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>Brand</th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>User</th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>Target Shop</th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>Pincode</th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>Date</th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(req => (
                <tr key={req._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 'bold', color: '#0f172a' }}>{req.productName}</td>
                  <td style={{ padding: '12px 16px', color: '#334155' }}>{req.brand || '-'}</td>
                  <td style={{ padding: '12px 16px', color: '#334155' }}>
                    {req.userId ? (
                      <div>
                        <div>{req.userId.name || "Customer"}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{req.userId.phone}</div>
                      </div>
                    ) : 'Unknown'}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#334155' }}>
                    {req.shopId ? req.shopId.name : <span style={{color: '#94a3b8', fontStyle: 'italic'}}>Any shop</span>}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#64748b' }}>{req.pincode || '-'}</td>
                  <td style={{ padding: '12px 16px', color: '#64748b' }}>{new Date(req.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ 
                      background: req.status === 'Added' ? '#dcfce7' : '#fef3c7', 
                      color: req.status === 'Added' ? '#166534' : '#92400e', 
                      padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold' 
                    }}>
                      {req.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

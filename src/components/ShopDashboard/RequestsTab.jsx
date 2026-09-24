import React, { useState, useEffect } from 'react';
import { shopFetch } from '../../utils/api.js';

const BASE_URL = (import.meta.env.VITE_API_BASE || "https://darkslategrey-snail-415133.hostingersite.com");

export default function RequestsTab({ shopData }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shopData) return;
    setLoading(true);
    shopFetch(shopData, `/shops/${shopData._id}/product-requests`)
      .then(res => res.json())
      .then(data => {
        setRequests(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [shopData]);

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontWeight: 'bold' }}>Loading customer requests...</div>;
  }

  if (requests.length === 0) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', background: '#fff', borderRadius: '16px', margin: '20px', border: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📦</div>
        <div style={{ color: '#0f172a', fontWeight: '800', fontSize: '1.2rem', marginBottom: '8px' }}>No Product Requests</div>
        <div style={{ color: '#64748b', fontSize: '0.9rem' }}>When customers near you request missing items, they'll appear here.</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h3 style={{ margin: '0 0 20px 0', color: '#0f172a', fontSize: '1.2rem', fontWeight: '900' }}>Customer Product Requests</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {requests.map(req => (
          <div key={req._id} style={{ background: '#fff', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '1.1rem', marginBottom: '4px' }}>
                  {req.productName}
                </div>
                {req.brand && (
                  <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: '600' }}>
                    Brand: <span style={{ color: '#334155' }}>{req.brand}</span>
                  </div>
                )}
                {req.userId && (
                  <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: '600', marginTop: '4px' }}>
                    👤 {req.userId.name || "Customer"} {req.userId.phone && `(${req.userId.phone})`}
                  </div>
                )}
                <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '8px' }}>
                  Requested on {new Date(req.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div style={{ background: req.status === 'Added' ? '#dcfce7' : '#fef3c7', color: req.status === 'Added' ? '#166534' : '#92400e', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '800' }}>
                {req.status}
              </div>
            </div>
            
            {req.status !== 'Added' && (
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed #e2e8f0' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>💡 Add this item from the Master Catalog in your Inventory tab to fulfill this request.</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

import React from 'react';

export default function ProductSkeletonGrid({ count = 6 }) {
  return (
    <div style={{ width: '100%', padding: '10px' }}>
      
      {/* 🌟 CSS INJECTION FOR THE SHIMMER ANIMATION */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200px 0; }
          100% { background-position: calc(200px + 100%) 0; }
        }
        .skeleton-shimmer {
          background-color: #f8fafc;
          background-image: linear-gradient(90deg, #f8fafc 0px, #e2e8f0 40px, #f8fafc 80px);
          background-size: 600px 100%;
          animation: shimmer 1.5s infinite linear;
        }
      `}</style>

      {/* SKELETON GRID LAYOUT */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
        gap: '15px' 
      }}>
        
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} style={{ 
            background: 'white', 
            borderRadius: '20px', 
            padding: '12px', 
            boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
            border: '1px solid #f1f5f9',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            {/* Image Placeholder */}
            <div className="skeleton-shimmer" style={{ width: '100%', height: '110px', borderRadius: '16px' }}></div>
            
            {/* Title Placeholders */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '5px' }}>
              <div className="skeleton-shimmer" style={{ width: '90%', height: '12px', borderRadius: '6px' }}></div>
              <div className="skeleton-shimmer" style={{ width: '60%', height: '12px', borderRadius: '6px' }}></div>
            </div>

            {/* Price & Button Placeholder Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
              <div className="skeleton-shimmer" style={{ width: '40%', height: '16px', borderRadius: '8px' }}></div>
              <div className="skeleton-shimmer" style={{ width: '35%', height: '30px', borderRadius: '10px' }}></div>
            </div>
          </div>
        ))}
        
      </div>
    </div>
  );
}

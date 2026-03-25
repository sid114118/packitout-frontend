import React from 'react';
import Header from './Header.jsx';
export default function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', fontFamily: 'sans-serif', backgroundColor: '#f4f7f6' }}>
      
      {/* HEADER */}
      <header style={{ backgroundColor: '#2c3e50', color: 'white', padding: '1.5rem', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 'bold' }}>📦 PackItOut</h1>
        <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', opacity: 0.8 }}>Never forget an item again.</p>
      </header>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, padding: '2rem', textAlign: 'center' }}>
        <h2>Welcome to your Packing List</h2>
        <p>Frontend is successfully built from scratch!</p>
      </main>

      {/* FOOTER */}
      <footer style={{ backgroundColor: '#ffffff', color: '#6c757d', padding: '1rem', textAlign: 'center', borderTop: '1px solid #e9ecef', marginTop: 'auto' }}>
        <p style={{ margin: 0, fontSize: '0.8rem' }}>© 2026 PackItOut.</p>
      </footer>
      
    </div>
  );
}

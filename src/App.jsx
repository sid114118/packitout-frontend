import React from 'react';
import Header from './Header.jsx';
import Footer from './Footer.jsx';

export default function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', fontFamily: 'sans-serif', backgroundColor: '#f4f7f6' }}>
      
      {/* This pulls your new Pincode/Shop Header onto the screen */}
      <Header />

      {/* MAIN CONTENT AREA */}
      <main style={{ flex: 1, padding: '2rem', textAlign: 'center' }}>
        <h2>Welcome to PackItOut</h2>
        <p>Your custom header and footer are now officially linked!</p>
      </main>

      {/* This pulls your Footer onto the screen */}
      <Footer />
      
    </div>
  );
}

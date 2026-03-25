import React, { useState, useEffect } from 'react';
import Header from './Header.jsx';
import Footer from './Footer.jsx';

export default function App() {
  // 1. The memory for our app
  const [items, setItems] = useState([]);
  const [newItemName, setNewItemName] = useState("");

  // 2. Your Golden Backend URL
  const API_URL = "https://darkslategrey-snail-415133.hostingersite.com/items";

  // 3. Load items from the database when the app opens
  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => setItems(data))
      .catch(err => console.log("Database connection error:", err));
  }, []);

  // 4. Send a new item to the database when the button is clicked
  const handleAddItem = async () => {
    if (!newItemName) return; // Don't send blank items

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newItemName })
    });

    const savedItem = await response.json();
    setItems([...items, savedItem]); // Add it to the screen instantly
    setNewItemName(""); // Clear the typing box
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', fontFamily: 'sans-serif', backgroundColor: '#f4f7f6' }}>
      
      <Header />

      <main style={{ flex: 1, padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ color: '#2c3e50', marginBottom: '1.5rem' }}>Your Packing List</h2>
        
        {/* --- THE INPUT & ADD BUTTON --- */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '30px' }}>
          <input 
            type="text" 
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="What do you need to pack?"
            style={{ padding: '12px', fontSize: '1rem', borderRadius: '6px', border: '1px solid #ccc', flex: 1, maxWidth: '250px', outline: 'none' }}
          />
          <button 
            onClick={handleAddItem}
            style={{ padding: '12px 20px', backgroundColor: '#2ed573', color: 'white', border: 'none', borderRadius: '6px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
          >
            Add
          </button>
        </div>

        {/* --- THE LIST OF ITEMS FROM MONGODB --- */}
        <ul style={{ listStyleType: 'none', padding: 0, maxWidth: '350px', margin: '0 auto' }}>
          {items.map((item, index) => (
            <li key={index} style={{ backgroundColor: 'white', padding: '15px', margin: '10px 0', borderRadius: '8px', borderLeft: '5px solid #ff4757', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.1rem', color: '#333' }}>
              <span>📦</span> {item.name}
            </li>
          ))}
        </ul>

      </main>

      <Footer />
      
    </div>
  );
}

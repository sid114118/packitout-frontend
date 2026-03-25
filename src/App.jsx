import React, { useState, useEffect } from 'react';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
import Categories from './Categories.jsx'; // Your new grid!

export default function App() {
  const [items, setItems] = useState([]);
  const [newItemName, setNewItemName] = useState("");

  const API_URL = "https://darkslategrey-snail-415133.hostingersite.com/items";

  // Load items from the database
  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => setItems(data))
      .catch(err => console.log("Database connection error:", err));
  }, []);

  // Send a new item to the database
  const handleAddItem = async () => {
    if (!newItemName) return;

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newItemName })
    });

    const savedItem = await response.json();
    setItems([...items, savedItem]);
    setNewItemName("");
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', fontFamily: 'sans-serif', backgroundColor: '#f4f7f6' }}>
      
      {/* 1. The Pincode Header */}
      <Header />
      
      {/* 2. The Brand New Category Grid */}
      <Categories />

      {/* 3. Your Database List Area */}
      <main style={{ flex: 1, padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ color: '#2c3e50', marginBottom: '1.5rem', fontSize: '1.2rem' }}>Your Packing List</h2>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '30px' }}>
          <input 
            type="text" 
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="What do you need?"
            style={{ padding: '12px', fontSize: '1rem', borderRadius: '6px', border: '1px solid #ccc', flex: 1, maxWidth: '250px', outline: 'none' }}
          />
          <button 
            onClick={handleAddItem}
            style={{ padding: '12px 20px', backgroundColor: '#2ed573', color: 'white', border: 'none', borderRadius: '6px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
          >
            Add
          </button>
        </div>

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

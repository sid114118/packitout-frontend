import React from 'react';

export default function Cart({ cart, onBack }) {
  // 🧮 Auto-calculates the total bill!
  const totalBill = cart.reduce((sum, item) => sum + (item.mrp * item.qty), 0);

  return (
    <div style={{ backgroundColor: '#f4f7f6', minHeight: '100vh', fontFamily: 'sans-serif', paddingBottom: '100px' }}>
      
      {/* HEADER */}
      <div style={{ backgroundColor: 'white', padding: '20px', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>⬅️</button>
        <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#2f3640' }}>Your Cart</h2>
      </div>

      <div style={{ padding: '20px' }}>
        {cart.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 20px', color: '#7f8fa6' }}>
            <div style={{ fontSize: '4rem', marginBottom: '10px' }}>🛒</div>
            <h3>Your cart is empty</h3>
            <p>Add some fresh groceries to get started!</p>
          </div>
        ) : (
          <>
            {/* CART ITEMS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
              {cart.map((item, index) => (
                <div key={index} style={{ backgroundColor: 'white', padding: '15px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ fontSize: '2rem', backgroundColor: '#f4f7f6', padding: '10px', borderRadius: '8px' }}>{item.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 5px 0', color: '#2f3640' }}>{item.name}</h4>
                    <span style={{ color: '#7f8fa6', fontSize: '0.85rem' }}>{item.qnty}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#2f3640' }}>₹{item.mrp}</p>
                    <span style={{ backgroundColor: '#f1f2f6', padding: '4px 10px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}>Qty: {item.qty}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* BILL SUMMARY */}
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#2f3640', borderBottom: '1px solid #f1f2f6', paddingBottom: '10px' }}>Bill Details</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#7f8fa6' }}>
                <span>Item Total</span> <span>₹{totalBill}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#7f8fa6' }}>
                <span>Delivery Fee</span> <span style={{ color: '#10b981' }}>FREE</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #f1f2f6', fontWeight: 'bold', fontSize: '1.2rem', color: '#2f3640' }}>
                <span>To Pay</span> <span>₹{totalBill}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* STICKY CHECKOUT BUTTON */}
      {cart.length > 0 && (
        <div style={{ position: 'fixed', bottom: 0, width: '100%', backgroundColor: 'white', padding: '15px 20px', boxShadow: '0 -4px 10px rgba(0,0,0,0.05)', boxSizing: 'border-box' }}>
          <button style={{ width: '100%', backgroundColor: '#10b981', color: 'white', border: 'none', padding: '16px', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', boxShadow: '0 4px 6px rgba(16, 185, 129, 0.3)' }}>
            <span>Pay ₹{totalBill}</span>
            <span>Checkout ➡️</span>
          </button>
        </div>
      )}
    </div>
  );
}

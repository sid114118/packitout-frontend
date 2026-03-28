import React from 'react';

export default function ProfileHeader({
  user,
  onExit,
  coinBalance,
  myReferralCode,
  isEditingProfile,
  setIsEditingProfile,
  editForm,
  setEditForm,
  handleSaveProfile,
  nearbyShops,
  primaryShop
}) {
  return (
    <>
      {/* 🟢 PREMIUM HEADER */}
      <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', padding: '30px 20px 50px 20px', color: 'white', borderBottomLeftRadius: '25px', borderBottomRightRadius: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)' }}>
        <div>
          <h2 style={{ margin: '0 0 5px 0', fontSize: '1.8rem' }}>{editForm.name || "Customer"}</h2>
          <p style={{ margin: 0, opacity: 0.9, fontSize: '0.9rem' }}>📞 {user?.phone} | 📍 {editForm.pincode}</p>
        </div>
        <button onClick={onExit} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', backdropFilter: 'blur(5px)' }}>
          Back to Shop
        </button>
      </div>

      {/* The content wrapper that pulls everything up over the header background */}
      <div style={{ padding: '0 20px', maxWidth: '600px', margin: '0 auto', marginTop: '-30px' }}>

        {/* 🪙 THE LOYALTY COIN BANNER */}
        <div style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', padding: '20px', borderRadius: '16px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 20px rgba(245, 158, 11, 0.3)', marginBottom: '15px' }}>
          <div>
            <span style={{ fontSize: '0.9rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9 }}>PackIt Coins</span>
            <h3 style={{ margin: '5px 0 0 0', fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🪙 {coinBalance}
            </h3>
          </div>
          <div style={{ textAlign: 'right', fontSize: '0.8rem', opacity: 0.9 }}>
            Earn 1 coin for<br/>every ₹10 spent!
          </div>
        </div>

        {/* 📢 REFER & EARN BANNER */}
        <div style={{ background: 'white', padding: '15px 20px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.03)', marginBottom: '25px', border: '1px solid #e2e8f0' }}>
          <div>
            <strong style={{ display: 'block', color: '#0f172a', fontSize: '1rem' }}>Refer & Earn 50 🪙</strong>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Give 50 coins, get 50!</span>
          </div>
          <div style={{ background: '#f1f5f9', padding: '8px 15px', borderRadius: '8px', border: '1px dashed #94a3b8', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: '900', color: '#334155', letterSpacing: '1px' }}>{myReferralCode || "LOADING..."}</span>
            <button 
              onClick={() => {
                if(myReferralCode) {
                  navigator.clipboard.writeText(myReferralCode);
                  alert("Referral Code Copied!");
                }
              }} 
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
            >📋</button>
          </div>
        </div>

        {/* 👤 PROFILE & PREFERENCES */}
        <div style={{ marginBottom: '25px', background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 10px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, color: '#334155', fontSize: '1.1rem' }}>Profile & Preferences</h3>
            <button onClick={() => setIsEditingProfile(!isEditingProfile)} style={{ color: '#10b981', background: 'none', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
              {isEditingProfile ? "Cancel" : "Edit"}
            </button>
          </div>

          {isEditingProfile ? (
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} placeholder="Full Name" required style={inputStyle} />
              <input type="text" value={editForm.pincode} onChange={e => setEditForm({...editForm, pincode: e.target.value})} placeholder="Pincode" required style={inputStyle} />
              
              <select value={editForm.primaryShop} onChange={e => setEditForm({...editForm, primaryShop: e.target.value})} style={inputStyle}>
                <option value="">-- Select Primary Shop --</option>
                {nearbyShops.map(shop => (
                  <option key={shop._id} value={shop._id}>{shop.name} ({shop.pincode})</option>
                ))}
              </select>

              <button type="submit" style={{ padding: '12px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '5px' }}>Save Changes</button>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.95rem', color: '#475569' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Name:</span> <strong>{editForm.name}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Pincode:</span> <strong>{editForm.pincode}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Primary Shop:</span> 
                <strong style={{ color: primaryShop ? '#10b981' : '#f59e0b', background: primaryShop ? '#ecfdf5' : '#fef3c7', padding: '4px 8px', borderRadius: '6px' }}>
                  {primaryShop ? `🏪 ${primaryShop.name}` : "Not Selected"}
                </strong>
              </div>
            </div>
          )}
        </div>

      </div>
    </>
  );
}

// Styling helper
const inputStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', outline: 'none' };
              

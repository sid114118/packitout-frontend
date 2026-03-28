import React, { useState, useEffect } from 'react';

// 🔗 IMPORTING YOUR WORKERS
import ProfileHeader from './components/UserDashboard/ProfileHeader';
import OrdersList from './components/UserDashboard/OrdersList';
import AddressBook from './components/UserDashboard/AddressBook';
import ReceiptModal from './components/UserDashboard/ReceiptModal';

export default function UserDashboard({ user, onExit, onLogout }) {
  // --- STATE MANAGEMENT ---
  const [orders, setOrders] = useState([]);
  const [pendingParchis, setPendingParchis] = useState([]); // 📸 NEW: Holds the raw uploads
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null); 
  
  const [coinBalance, setCoinBalance] = useState(user?.coins || 0);
  const [myReferralCode, setMyReferralCode] = useState(user?.referralCode || ""); 
  const [primaryShop, setPrimaryShop] = useState(null);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({ name: user?.name || "", pincode: user?.pincode || "", primaryShop: "" });
  const [nearbyShops, setNearbyShops] = useState([]);

  const [addresses, setAddresses] = useState([
    { id: 1, label: "🏠 Home", detail: `Block A, Near Main Gate, ${user?.pincode}` }
  ]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState("");

  const BASE_URL = "https://darkslategrey-snail-415133.hostingersite.com";

  // --- DATA FETCHING ---
  useEffect(() => {
    // 1. Fetch Processed Orders
    fetch(`${BASE_URL}/orders`)
      .then(res => res.json())
      .then(data => {
        setOrders(data.filter(order => order.userId?._id === user._id));
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // 2. 📸 Fetch Pending Raw Parchis for this User
    // (Using a double-fetch trick just in case your backend uses a general route)
    fetch(`${BASE_URL}/parchis`)
      .then(res => res.json())
      .then(data => {
        // Filter out only the parchis uploaded by THIS customer
        const myParchis = data.filter(p => p.userId === user._id || p.userId?._id === user._id);
        setPendingParchis(myParchis);
      })
      .catch(err => console.log("No pending parchis found", err));

    // 3. Fetch Profile & Coins
    fetch(`${BASE_URL}/users/${user._id}`)
      .then(res => res.json())
      .then(data => {
        if (data) {
          if (data.coins !== undefined) setCoinBalance(data.coins);
          if (data.referralCode) setMyReferralCode(data.referralCode);
          if (data.primaryShop) {
            setPrimaryShop(data.primaryShop);
            setEditForm(prev => ({ ...prev, primaryShop: data.primaryShop._id }));
          }
          const updatedUser = { ...user, coins: data.coins, referralCode: data.referralCode, primaryShop: data.primaryShop };
          localStorage.setItem("packitout_user", JSON.stringify(updatedUser));
        }
      });

    // 4. Fetch Nearby Shops
    if (user?.pincode) {
      fetch(`${BASE_URL}/shops/all/${user.pincode}`)
        .then(res => res.json())
        .then(data => setNearbyShops(data))
        .catch(err => console.log("Failed to fetch shops"));
    }
  }, [user._id, user]);

  // Derived State for Orders
  const activeOrders = orders.filter(o => o.status !== "Delivered ✅" && o.status !== "Done 🎉");
  const pastOrders = orders.filter(o => o.status === "Delivered ✅" || o.status === "Done 🎉");

  // --- LOGIC FUNCTIONS ---
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BASE_URL}/users/${user._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm)
      });
      const updatedUser = await res.json();
      if (updatedUser) {
        setPrimaryShop(updatedUser.primaryShop);
        setIsEditingProfile(false);
        alert("✅ Profile Updated Successfully!");
      }
    } catch (err) { alert("❌ Failed to update profile"); }
  };

  const handleSaveAddress = (e) => {
    e.preventDefault();
    if (newAddress.trim() !== "") {
      setAddresses([...addresses, { id: Date.now(), label: "📍 Saved", detail: newAddress }]);
      setNewAddress("");
      setShowAddressForm(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#f0f4f8', minHeight: '100vh', fontFamily: 'sans-serif', paddingBottom: '40px' }}>
      
      <ProfileHeader 
        user={user} onExit={onExit} coinBalance={coinBalance} myReferralCode={myReferralCode}
        isEditingProfile={isEditingProfile} setIsEditingProfile={setIsEditingProfile}
        editForm={editForm} setEditForm={setEditForm} handleSaveProfile={handleSaveProfile}
        nearbyShops={nearbyShops} primaryShop={primaryShop}
      />

      <div style={{ padding: '0 20px 20px 20px', maxWidth: '600px', margin: '0 auto' }}>
        
        {/* 📸 Passed the new pendingParchis state to the OrdersList! */}
        <OrdersList 
          activeOrders={activeOrders} 
          pastOrders={pastOrders} 
          pendingParchis={pendingParchis}
          loading={loading} 
          setSelectedOrder={setSelectedOrder} 
        />

        <AddressBook 
          addresses={addresses} showAddressForm={showAddressForm} setShowAddressForm={setShowAddressForm}
          newAddress={newAddress} setNewAddress={setNewAddress} handleSaveAddress={handleSaveAddress}
        />

        <button onClick={onLogout} style={{ width: '100%', padding: '15px', marginTop: '10px', background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>
          Log Out
        </button>

      </div>

      <ReceiptModal 
        selectedOrder={selectedOrder} setSelectedOrder={setSelectedOrder} 
      />

    </div>
  );
}

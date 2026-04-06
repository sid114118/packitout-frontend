import React, { useState, useEffect } from 'react';
import OneSignal from 'react-onesignal'; 

// 🔗 IMPORTING YOUR WORKERS
import ProfileHeader from './components/UserDashboard/ProfileHeader';
import OrdersList from './components/UserDashboard/OrdersList';
import AddressBook from './components/UserDashboard/AddressBook';
import ReceiptModal from './components/UserDashboard/ReceiptModal';
// 🌟 IMPORT THE NEW REVIEW MODAL!
import OrderReviewModal from './components/UserDashboard/OrderReviewModal'; 

export default function UserDashboard({ user, onExit, onLogout }) {
  // --- STATE MANAGEMENT ---
  const [orders, setOrders] = useState([]);
  const [pendingParchis, setPendingParchis] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null); 
  
  // 🌟 NEW: STATE FOR THE REVIEW MODAL
  const [orderToReview, setOrderToReview] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  
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

  // --- DATA FETCHING & INITIALIZATION ---
  const fetchOrders = () => {
    fetch(`${BASE_URL}/orders`)
      .then(res => res.json())
      .then(data => {
        setOrders(data.filter(order => order.userId?._id === user._id));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    // 1. Init OneSignal
    const initOneSignal = async () => {
      try {
        await OneSignal.init({
          appId: "1da2e78d-0874-4965-a895-42c9237ee92b",
          safari_web_id: "web.onesignal.auto.13d8bf97-93cf-4a09-b799-2a50baaf1ebd",
          notifyButton: { enable: true },
          allowLocalhostAsSecureOrigin: true,
        });
        if (user && user._id) { OneSignal.login(user._id); }
      } catch (err) { console.log("OneSignal Init Error:", err); }
    };
    initOneSignal();

    // 2. Fetch Orders
    fetchOrders();

    // 3. Fetch Pending Parchis
    fetch(`${BASE_URL}/parchis/user/${user._id}`)
      .then(res => res.json())
      .then(data => {
        const myParchis = data.filter(p => p.userId === user._id || p.userId?._id === user._id);
        setPendingParchis(myParchis);
      })
      .catch(err => console.log("No pending parchis found", err));

    // 4. Fetch Profile & Coins
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

    // 5. Fetch Nearby Shops
    if (user?.pincode) {
      fetch(`${BASE_URL}/shops/all/${user.pincode}`)
        .then(res => res.json())
        .then(data => setNearbyShops(data))
        .catch(err => console.log("Failed to fetch shops"));
    }
  }, [user._id]);

  // --- LOGIC FUNCTIONS ---
  
  // 🌟 NEW: HANDLE UNIFIED ORDER REVIEW SUBMISSION
  const handleOrderReview = async (reviewPayload) => {
    try {
      const payloadWithUser = {
        ...reviewPayload,
        userId: user._id,
        userName: user.name || "Customer"
      };

      const response = await fetch(`${BASE_URL}/reviews/order-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadWithUser)
      });

      if (response.ok) {
        alert("Thank you for your valuable feedback! 🎉");
        setIsReviewModalOpen(false); // Close the modal
        fetchOrders(); // Refresh orders so the "Rate Order" button disappears
      } else {
        alert("Failed to save review. Please try again.");
      }
    } catch (err) {
      console.error("Review error:", err);
      alert("Network error. Please check your connection.");
    }
  };

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

  const activeOrders = orders.filter(o => o.status !== "Delivered ✅" && o.status !== "Done 🎉");
  const pastOrders = orders.filter(o => o.status === "Delivered ✅" || o.status === "Done 🎉");

  return (
    <div style={{ backgroundColor: '#f0f4f8', minHeight: '100vh', fontFamily: 'sans-serif', paddingBottom: '40px' }}>
      
      <ProfileHeader 
        user={user} onExit={onExit} coinBalance={coinBalance} myReferralCode={myReferralCode}
        isEditingProfile={isEditingProfile} setIsEditingProfile={setIsEditingProfile}
        editForm={editForm} setEditForm={setEditForm} handleSaveProfile={handleSaveProfile}
        nearbyShops={nearbyShops} primaryShop={primaryShop}
      />

      <div style={{ padding: '0 20px 20px 20px', maxWidth: '600px', margin: '0 auto' }}>
        
        <OrdersList 
          activeOrders={activeOrders} 
          pastOrders={pastOrders} 
          pendingParchis={pendingParchis}
          loading={loading} 
          setSelectedOrder={setSelectedOrder} 
          // 🌟 NEW: THIS OPENS THE REVIEW MODAL!
          onOpenReview={(order) => {
            setOrderToReview(order);
            setIsReviewModalOpen(true);
          }}
        />

        <AddressBook 
          addresses={addresses} showAddressForm={showAddressForm} setShowAddressForm={setShowAddressForm}
          newAddress={newAddress} setNewAddress={setNewAddress} handleSaveAddress={handleSaveAddress}
        />

        <button onClick={onLogout} style={{ width: '100%', padding: '15px', marginTop: '10px', background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>
          Log Out
        </button>

      </div>

      {/* 🧾 THE NORMAL RECEIPT MODAL */}
      <ReceiptModal 
        selectedOrder={selectedOrder} 
        setSelectedOrder={setSelectedOrder} 
      />

      {/* ⭐ THE NEW REVIEW MODAL */}
      <OrderReviewModal 
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setOrderToReview(null);
        }}
        order={orderToReview}
        onSubmitReviews={handleOrderReview}
      />

    </div>
  );
}

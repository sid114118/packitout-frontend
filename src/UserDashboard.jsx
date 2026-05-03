import React, { useState, useEffect } from 'react';
import OneSignal from 'react-onesignal'; 

import ProfileHeader from './components/UserDashboard/ProfileHeader';
import OrdersList from './components/UserDashboard/OrdersList';
import AddressBook from './components/UserDashboard/AddressBook';
import ReceiptModal from './components/UserDashboard/ReceiptModal';
import OrderReviewModal from './components/UserDashboard/OrderReviewModal'; 

export default function UserDashboard({ user, onExit, onLogout }) {
  // --- STATE ---
  const [orders, setOrders] = useState([]);
  const [pendingParchis, setPendingParchis] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null); 
  const [orderToReview, setOrderToReview] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [coinBalance, setCoinBalance] = useState(user?.coins || 0);
  const [myReferralCode, setMyReferralCode] = useState(user?.referralCode || ""); 
  const [primaryShop, setPrimaryShop] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({ name: user?.name || "", pincode: user?.pincode || "", primaryShop: "" });
  const [nearbyShops, setNearbyShops] = useState([]);
  const [addresses, setAddresses] = useState([{ id: 1, label: "🏠 Home", detail: `Block A, Near Main Gate, ${user?.pincode}` }]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState("");

  // 🌟 NEW: PREMIUM POP-UP STATES
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [confirmData, setConfirmData] = useState({ show: false, title: '', message: '', onConfirm: null });

  const BASE_URL = "https://darkslategrey-snail-415133.hostingersite.com";

  // --- HELPER: SHOW TOAST ---
  const triggerToast = (msg, type = 'success') => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  // --- DATA FETCHING ---
  const fetchOrders = () => {
    fetch(`${BASE_URL}/orders`)
      .then(res => res.json())
      .then(data => {
        const myOrders = data
          .filter(order => order.userId?._id === user._id || order.userId === user._id)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setOrders(myOrders);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
    // OneSignal & Profile fetch logic remains the same...
    const initOneSignal = async () => {
      try {
        await OneSignal.init({ appId: "1da2e78d-0874-4965-a895-42c9237ee92b", allowLocalhostAsSecureOrigin: true });
        if (user?._id) OneSignal.login(user._id);
      } catch (e) {}
    };
    initOneSignal();
  }, [user._id]);

  // --- LOGIC FUNCTIONS ---

  // ❌ CUSTOM CANCEL FLOW
  const initiateCancel = (orderId) => {
    setConfirmData({
      show: true,
      title: "Cancel Order?",
      message: "Are you sure? This action cannot be undone.",
      onConfirm: () => executeCancel(orderId)
    });
  };

  const executeCancel = async (orderId) => {
    setConfirmData({ ...confirmData, show: false });
    try {
      const res = await fetch(`${BASE_URL}/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Cancelled ❌" })
      });
      if (res.ok) {
        triggerToast("Order cancelled successfully!");
        fetchOrders();
      } else {
        triggerToast("Could not cancel. Order is in process.", "error");
      }
    } catch (err) {
      triggerToast("Network error. Try again.", "error");
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
      if (res.ok) {
        const updated = await res.json();
        setPrimaryShop(updated.primaryShop);
        setIsEditingProfile(false);
        triggerToast("Profile updated!");
      }
    } catch (err) { triggerToast("Failed to update profile", "error"); }
  };

  const activeOrders = orders.filter(o => o.status !== "Delivered ✅" && o.status !== "Done 🎉" && !o.status.includes("Cancelled"));
  const pastOrders = orders.filter(o => o.status === "Delivered ✅" || o.status === "Done 🎉" || o.status.includes("Cancelled"));

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif', paddingBottom: '60px' }}>
      
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
          onOpenReview={(order) => { setOrderToReview(order); setIsReviewModalOpen(true); }}
          onCancelOrder={initiateCancel} // ⚡ Uses our new Custom Confirm
        />

        <AddressBook 
          addresses={addresses} showAddressForm={showAddressForm} setShowAddressForm={setShowAddressForm}
          newAddress={newAddress} setNewAddress={setNewAddress} handleSaveAddress={(e) => { e.preventDefault(); triggerToast("Address Saved!"); setShowAddressForm(false); }}
        />

        <button onClick={onLogout} style={{ width: '100%', padding: '16px', marginTop: '15px', background: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3', borderRadius: '16px', fontWeight: '800', cursor: 'pointer' }}>
          Log Out
        </button>
      </div>

      {/* 🧾 MODALS */}
      <ReceiptModal selectedOrder={selectedOrder} setSelectedOrder={setSelectedOrder} />
      <OrderReviewModal isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} order={orderToReview} onSubmitReviews={() => triggerToast("Feedback received!")} />

      {/* 🌟 PREMIUM TOAST NOTIFICATION */}
      {toast.show && (
        <div style={{ position: 'fixed', top: '25px', left: '50%', transform: 'translateX(-50%)', backgroundColor: toast.type === 'success' ? '#0c831f' : '#ef4444', color: 'white', padding: '12px 24px', borderRadius: '14px', zIndex: 9999, fontWeight: '700', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '10px', animation: 'slideIn 0.3s ease-out' }}>
          <style>{`@keyframes slideIn { from { transform: translate(-50%, -100px); } to { transform: translate(-50%, 0); } }`}</style>
          <span>{toast.type === 'success' ? '✅' : '❌'}</span>
          {toast.message}
        </div>
      )}

      {/* 🌟 PREMIUM CONFIRMATION MODAL */}
      {confirmData.show && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '320px', padding: '25px', borderRadius: '24px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.25rem', fontWeight: '900', color: '#0f172a' }}>{confirmData.title}</h3>
            <p style={{ margin: '0 0 25px 0', color: '#64748b', fontSize: '0.95rem', lineHeight: '1.5', fontWeight: '500' }}>{confirmData.message}</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setConfirmData({ ...confirmData, show: false })} style={{ flex: 1, padding: '12px', border: '1px solid #e2e8f0', background: 'white', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', color: '#64748b' }}>Dismiss</button>
              <button onClick={confirmData.onConfirm} style={{ flex: 1, padding: '12px', border: 'none', background: '#ef4444', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', color: 'white' }}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

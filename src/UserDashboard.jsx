import React, { useState, useEffect, useRef } from 'react';
import OneSignal from 'react-onesignal';
import { useToast, useConfirm } from './ui/DialogProvider.jsx';

import ProfileHeader from './components/UserDashboard/ProfileHeader';
import OrdersList from './components/UserDashboard/OrdersList';
import AddressBook from './components/UserDashboard/AddressBook';
import ReceiptModal from './components/UserDashboard/ReceiptModal';
import OrderReviewModal from './components/UserDashboard/OrderReviewModal'; 

export default function UserDashboard({ user, onExit, onLogout, initialSection }) {
  const triggerToast = useToast();
  const askConfirm = useConfirm();
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

  const BASE_URL = "https://darkslategrey-snail-415133.hostingersite.com";

  const ordersRef = useRef(null);
  useEffect(() => {
    if (initialSection !== 'orders') return;
    const id = window.requestAnimationFrame(() => {
      ordersRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => window.cancelAnimationFrame(id);
  }, [initialSection]);

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
  const initiateCancel = async (orderId) => {
    const ok = await askConfirm({
      title: 'Cancel order?',
      message: 'Are you sure? This action cannot be undone.',
      confirmText: 'Cancel order',
      cancelText: 'Keep order',
      danger: true,
    });
    if (!ok) return;
    executeCancel(orderId);
  };

  const executeCancel = async (orderId) => {
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
        <div ref={ordersRef} style={{ scrollMarginTop: '12px' }}>
          <OrdersList
            activeOrders={activeOrders}
            pastOrders={pastOrders}
            pendingParchis={pendingParchis}
            loading={loading}
            setSelectedOrder={setSelectedOrder}
            onOpenReview={(order) => { setOrderToReview(order); setIsReviewModalOpen(true); }}
            onCancelOrder={initiateCancel}
          />
        </div>

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
    </div>
  );
}

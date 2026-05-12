import React, { useState, useEffect } from 'react';
import { useToast } from './ui/DialogProvider.jsx';

import ProfileHeader from './components/UserDashboard/ProfileHeader';
import AddressBook from './components/UserDashboard/AddressBook';

const BASE_URL = (import.meta.env.VITE_API_BASE || "https://darkslategrey-snail-415133.hostingersite.com");

export default function UserDashboard({ user, onExit, onLogout, onUserUpdate }) {
  const triggerToast = useToast();

  // Derive directly from the user prop so a successful save (or any future
  // refresh of the user object via onUserUpdate) updates the UI immediately.
  const coinBalance = user?.coins || 0;
  const myReferralCode = user?.referralCode || "";

  const [primaryShop, setPrimaryShop] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user?.name || "",
    pincode: user?.pincode || "",
    primaryShop: typeof user?.primaryShop === 'object' ? user.primaryShop?._id : (user?.primaryShop || ""),
  });
  const [nearbyShops, setNearbyShops] = useState([]);
  const [addresses] = useState([{ id: 1, label: "🏠 Home", detail: `Block A, Near Main Gate, ${user?.pincode}` }]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState("");

  // Fetch shops in this user's pincode so the "Primary shop" dropdown has
  // real options. Without this the select is permanently empty.
  useEffect(() => {
    if (!user?.pincode) return;
    let cancelled = false;
    fetch(`${BASE_URL}/shops/all/${user.pincode}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => { if (!cancelled) setNearbyShops(Array.isArray(data) ? data : []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user?.pincode]);

  // Resolve the user's current primary shop into a friendly object for the
  // info row in ProfileHeader.
  useEffect(() => {
    const pid = typeof user?.primaryShop === 'object' ? user.primaryShop?._id : user?.primaryShop;
    if (!pid || nearbyShops.length === 0) return;
    const match = nearbyShops.find(s => s._id === pid);
    if (match) setPrimaryShop(match);
  }, [user?.primaryShop, nearbyShops]);

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
        // Push the new user up to App so the header/orders/etc. all refresh.
        if (onUserUpdate) onUserUpdate(updated);
        setPrimaryShop(updated.primaryShop && typeof updated.primaryShop === 'object' ? updated.primaryShop : nearbyShops.find(s => s._id === updated.primaryShop) || null);
        setIsEditingProfile(false);
        triggerToast("Profile updated!");
      } else {
        triggerToast("Failed to update profile", "error");
      }
    } catch (err) { triggerToast("Failed to update profile", "error"); }
  };

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif', paddingBottom: '90px' }}>

      <ProfileHeader
        user={user} onExit={onExit} coinBalance={coinBalance} myReferralCode={myReferralCode}
        isEditingProfile={isEditingProfile} setIsEditingProfile={setIsEditingProfile}
        editForm={editForm} setEditForm={setEditForm} handleSaveProfile={handleSaveProfile}
        nearbyShops={nearbyShops} primaryShop={primaryShop}
      />

      <div style={{ padding: '0 20px 20px 20px', maxWidth: '600px', margin: '0 auto' }}>

        {/* Quick link to Orders page */}
        <button
          onClick={() => window.location.hash = "#orders"}
          style={{
            width: '100%', marginBottom: '15px',
            padding: '16px',
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer', boxShadow: '0 4px 14px rgba(15,23,42,0.04)',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '12px' }}>
            <span style={{
              width: '38px', height: '38px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.1rem',
            }}>🧾</span>
            <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>My orders</span>
          </span>
          <span style={{ color: '#94a3b8', fontSize: '1.2rem' }}>›</span>
        </button>

        <AddressBook
          addresses={addresses} showAddressForm={showAddressForm} setShowAddressForm={setShowAddressForm}
          newAddress={newAddress} setNewAddress={setNewAddress} handleSaveAddress={(e) => { e.preventDefault(); triggerToast("Address Saved!"); setShowAddressForm(false); }}
        />

        <button onClick={onLogout} style={{ width: '100%', padding: '16px', marginTop: '15px', background: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3', borderRadius: '16px', fontWeight: '800', cursor: 'pointer' }}>
          Log Out
        </button>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useToast } from './ui/DialogProvider.jsx';
import { userFetch } from './utils/api.js';

import ProfileHeader from './components/UserDashboard/ProfileHeader';
import AddressBook from './components/UserDashboard/AddressBook';
import TermsModal from './components/UserDashboard/TermsModal';
import ComplaintModal from './components/UserDashboard/ComplaintModal';
import MyComplaintsModal from './components/UserDashboard/MyComplaintsModal';
import ParchiBillModal from './components/UserDashboard/ParchiBillModal';

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

  // Support modals (T&C + complaint form + my complaints + parchi bills) live at the bottom of the profile.
  const [showTerms, setShowTerms] = useState(false);
  const [showComplaint, setShowComplaint] = useState(false);
  const [showMyComplaints, setShowMyComplaints] = useState(false);
  const [showParchiBills, setShowParchiBills] = useState(false);

  // Fetch shops in this user's pincode so the "Primary shop" dropdown has
  // real options. Without this the select is permanently empty.
  useEffect(() => {
    if (!user?.pincode) return;
    let cancelled = false;
    userFetch(user, `/shops/all/${user.pincode}`)
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
      const res = await userFetch(user, `/users/${user._id}`, {
        method: "PATCH",
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
            width: '100%', marginBottom: '10px',
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

        {/* Parchi bills awaiting payment */}
        <button
          onClick={() => setShowParchiBills(true)}
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
              background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.1rem',
            }}>🧾</span>
            <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>My Parchi Bills</span>
              <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>Pay UPI or pickup, see past bills</span>
            </span>
          </span>
          <span style={{ color: '#94a3b8', fontSize: '1.2rem' }}>›</span>
        </button>

        <AddressBook user={user} />

        {/* Help & Legal — file a complaint and read the T&C */}
        <div style={{ marginTop: '15px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 14px rgba(15,23,42,0.04)' }}>
          <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase', padding: '14px 16px 6px' }}>
            Help & Legal
          </div>

          <button
            onClick={() => setShowComplaint(true)}
            style={{
              width: '100%', padding: '14px 16px',
              background: '#fff', border: 'none', borderTop: '1px solid #f1f5f9',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer', textAlign: 'left',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '12px' }}>
              <span style={{
                width: '38px', height: '38px', borderRadius: '12px',
                background: 'linear-gradient(135deg, #fff1f2, #fee2e2)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.1rem',
              }}>📣</span>
              <span>
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>File a Complaint</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>About a shop, item, or the app</div>
              </span>
            </span>
            <span style={{ color: '#94a3b8', fontSize: '1.2rem' }}>›</span>
          </button>

          <button
            onClick={() => setShowMyComplaints(true)}
            style={{
              width: '100%', padding: '14px 16px',
              background: '#fff', border: 'none', borderTop: '1px solid #f1f5f9',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer', textAlign: 'left',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '12px' }}>
              <span style={{
                width: '38px', height: '38px', borderRadius: '12px',
                background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.1rem',
              }}>💬</span>
              <span>
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>My Complaints &amp; Replies</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>See responses from the shop or admin</div>
              </span>
            </span>
            <span style={{ color: '#94a3b8', fontSize: '1.2rem' }}>›</span>
          </button>

          <button
            onClick={() => setShowTerms(true)}
            style={{
              width: '100%', padding: '14px 16px',
              background: '#fff', border: 'none', borderTop: '1px solid #f1f5f9',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer', textAlign: 'left',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '12px' }}>
              <span style={{
                width: '38px', height: '38px', borderRadius: '12px',
                background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.1rem',
              }}>📜</span>
              <span>
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>Terms & Conditions</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>How PackItOut works</div>
              </span>
            </span>
            <span style={{ color: '#94a3b8', fontSize: '1.2rem' }}>›</span>
          </button>
        </div>

        <button onClick={onLogout} style={{ width: '100%', padding: '16px', marginTop: '15px', background: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3', borderRadius: '16px', fontWeight: '800', cursor: 'pointer' }}>
          Log Out
        </button>
      </div>

      <TermsModal open={showTerms} onClose={() => setShowTerms(false)} />
      <ComplaintModal open={showComplaint} onClose={() => setShowComplaint(false)} user={user} />
      <MyComplaintsModal open={showMyComplaints} onClose={() => setShowMyComplaints(false)} user={user} />
      <ParchiBillModal open={showParchiBills} onClose={() => setShowParchiBills(false)} user={user} />
    </div>
  );
}

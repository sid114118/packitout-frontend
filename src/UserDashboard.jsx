import React, { useState, useEffect } from 'react';
import { useToast } from './ui/DialogProvider.jsx';
import { userFetch, BASE_URL } from './utils/api.js';

import ProfileHeader from './components/UserDashboard/ProfileHeader';
import AddressBook from './components/UserDashboard/AddressBook';
import TermsModal from './components/UserDashboard/TermsModal';
import ComplaintModal from './components/UserDashboard/ComplaintModal';
import MyComplaintsModal from './components/UserDashboard/MyComplaintsModal';
import ParchiBillModal from './components/UserDashboard/ParchiBillModal';
import MyKhataModal from './components/UserDashboard/MyKhataModal.jsx';
import RequestItemModal from './components/UserDashboard/RequestItemModal.jsx';
import ChatIcon from './ui/ChatIcon.jsx';
import { openWhatsAppChat } from './utils/whatsappShare.js';
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
    phone: user?.phone || "",
    pincode: user?.pincode || "",
    primaryShop: typeof user?.primaryShop === 'object' ? user.primaryShop?._id : (user?.primaryShop || ""),
  });
  const [nearbyShops, setNearbyShops] = useState([]);

  useEffect(() => {
    setEditForm({
      name: user?.name || "",
      phone: user?.phone || "",
      pincode: user?.pincode || "",
      primaryShop: typeof user?.primaryShop === 'object' ? user.primaryShop?._id : (user?.primaryShop || ""),
    });
  }, [user]);

  // Support modals (T&C + complaint form + my complaints + parchi bills) live at the bottom of the profile.
  const [showTerms, setShowTerms] = useState(false);
  const [showComplaint, setShowComplaint] = useState(false);
  const [showRequestItem, setShowRequestItem] = useState(false);
  const [showMyComplaints, setShowMyComplaints] = useState(false);
  const [showParchiBills, setShowParchiBills] = useState(false);
  const [khataInfo, setKhataInfo] = useState(null);
  const [showMyKhata, setShowMyKhata] = useState(false);

  const fetchUserKhata = async () => {
    if (!user?._id) return;
    try {
      const res = await userFetch(user, `/users/${user._id}/khata`);
      if (!res.ok) return;
      const data = await res.json();
      setKhataInfo(data);
    } catch {}
  };

  useEffect(() => {
    fetchUserKhata();
    if (!user?._id || !user?.sessionToken) return;
    const sseUrl = `${BASE_URL.replace(/\/api$/, '')}/user-events/${user._id}?token=${user.sessionToken}`;
    const eventSource = new EventSource(sseUrl);
    let khataTimer;
    eventSource.addEventListener('refresh_khata', () => {
      clearTimeout(khataTimer);
      khataTimer = setTimeout(fetchUserKhata, 400);
    });
    return () => {
      clearTimeout(khataTimer);
      eventSource.close();
    };
  }, [user?._id, user?.sessionToken, user?.phone]);

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
      const cleanPhone = String(editForm.phone || '').replace(/\D/g, '').slice(-10);
      let phoneUpdated = false;
      if (cleanPhone && cleanPhone !== (user?.phone || '')) {
        if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
          triggerToast("Enter a valid 10-digit Indian mobile number", "error");
          return;
        }
        const phoneRes = await userFetch(user, `/users/${user._id}/phone`, {
          method: "POST",
          body: JSON.stringify({ phone: cleanPhone })
        });
        if (!phoneRes.ok) {
          const pData = await phoneRes.json().catch(() => ({}));
          triggerToast(pData.error || "Failed to link mobile number", "error");
          return;
        }
        phoneUpdated = true;
      }

      const res = await userFetch(user, `/users/${user._id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: editForm.name,
          pincode: editForm.pincode,
          primaryShop: editForm.primaryShop,
        })
      });
      if (res.ok) {
        const updated = await res.json();
        // Server response strips sessionToken — preserve the in-memory one
        // so the next authenticated API call doesn't fail with 401.
        const next = {
          ...updated,
          phone: phoneUpdated ? cleanPhone : (updated.phone || user?.phone),
          sessionToken: user.sessionToken,
        };
        // Push the new user up to App so the header/orders/etc. all refresh.
        if (onUserUpdate) onUserUpdate(next);
        setPrimaryShop(updated.primaryShop && typeof updated.primaryShop === 'object' ? updated.primaryShop : nearbyShops.find(s => s._id === updated.primaryShop) || null);
        setIsEditingProfile(false);
        triggerToast("Profile updated!");
        fetchUserKhata();
      } else {
        triggerToast("Failed to update profile", "error");
      }
    } catch (err) { triggerToast("Failed to update profile", "error"); }
  };

  const handleShareApp = async () => {
    const shareData = {
      title: 'PackItOut',
      text: 'Check out PackItOut - The easiest way to order from your local shops!',
      url: window.location.origin
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        openWhatsAppChat('', `${shareData.text} ${shareData.url}`);
      }
    } catch (err) {
      console.log('Error sharing:', err);
    }
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

        {/* Conditional Store Khata Passbook (ONLY visible if user uses Khata) */}
        {khataInfo?.hasAnyKhata === true && (
          <button
            onClick={() => setShowMyKhata(true)}
            style={{
              width: '100%', marginBottom: '10px',
              padding: '16px',
              background: '#fff',
              border: khataInfo.totalPendingAcrossShops > 0 ? '1.5px solid #f59e0b' : '1px solid #e2e8f0',
              borderRadius: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer', boxShadow: '0 4px 14px rgba(15,23,42,0.04)',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '12px' }}>
              <span style={{
                width: '38px', height: '38px', borderRadius: '12px',
                background: 'linear-gradient(135deg, #fffbeb, #fde68a)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.1rem',
              }}>📒</span>
              <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>My Store Khata</span>
                <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>
                  View digital passbook, bills &amp; pay dues via UPI
                </span>
              </span>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              {khataInfo.totalPendingAcrossShops > 0 ? (
                <span style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #f59e0b', padding: '3px 9px', borderRadius: '999px', fontWeight: 900, fontSize: '0.74rem' }}>
                  ₹{Math.round(khataInfo.totalPendingAcrossShops)} Due
                </span>
              ) : khataInfo.pendingVerificationCount > 0 ? (
                <span style={{ background: '#fef08a', color: '#854d0e', border: '1px solid #facc15', padding: '3px 9px', borderRadius: '999px', fontWeight: 900, fontSize: '0.72rem' }}>
                  ⏳ Verify Pending
                </span>
              ) : (
                <span style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', padding: '3px 9px', borderRadius: '999px', fontWeight: 900, fontSize: '0.72rem' }}>
                  ₹0 Settled ✅
                </span>
              )}
              <span style={{ color: '#94a3b8', fontSize: '1.2rem' }}>›</span>
            </span>
          </button>
        )}

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

        <button
          onClick={handleShareApp}
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
              background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.1rem',
            }}>🚀</span>
            <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>Share App</span>
              <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>Invite friends to PackItOut</span>
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
            onClick={() => setShowRequestItem(true)}
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
                background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.1rem',
              }}>📦</span>
              <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>Request a Product</span>
                <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>Ask shops to add missing items</span>
              </span>
            </span>
            <span style={{ color: '#94a3b8', fontSize: '1.2rem' }}>›</span>
          </button>

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
              }}>
                <ChatIcon size={18} color="#16a34a" />
              </span>
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
      <MyKhataModal open={showMyKhata} onClose={() => setShowMyKhata(false)} user={user} onKhataUpdated={fetchUserKhata} />
      {showRequestItem && <RequestItemModal user={user} onClose={() => setShowRequestItem(false)} />}
    </div>
  );
}

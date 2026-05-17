import React, { useState } from 'react';
import { useToast } from '../../ui/DialogProvider.jsx';

const BASE_URL = (import.meta.env.VITE_API_BASE || "https://darkslategrey-snail-415133.hostingersite.com");

export default function ShopLocationBanner({ shopData, onShopUpdated }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const hasLocation = Array.isArray(shopData?.location?.coordinates)
    && shopData.location.coordinates.length === 2
    && Number.isFinite(shopData.location.coordinates[0])
    && Number.isFinite(shopData.location.coordinates[1]);

  const captureAndSave = () => {
    if (!navigator.geolocation) {
      toast("Your browser doesn't support location. Use a recent Chrome/Safari.", 'error');
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude, accuracy } = pos.coords;
          const authHeader = shopData.sessionToken ? { "Authorization": `Bearer ${shopData.sessionToken}` } : {};
          const res = await fetch(`${BASE_URL}/shops/${shopData._id}/location`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", ...authHeader },
            body: JSON.stringify({ lat: latitude, lng: longitude }),
          });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || "Could not save location.");
          }
          const updated = await res.json();
          // Preserve the in-memory sessionToken — server response doesn't include it.
          onShopUpdated({ ...updated, sessionToken: shopData.sessionToken });
          if (accuracy > 100) {
            toast(`📍 Location saved — GPS accuracy was ±${Math.round(accuracy)}m, retry if you weren't inside the shop.`, 'success');
          } else {
            toast("📍 Shop location saved!", 'success');
          }
        } catch (err) {
          toast(err.message || "Could not save location.", 'error');
        } finally {
          setBusy(false);
        }
      },
      (err) => {
        setBusy(false);
        if (err.code === 1) toast("Location permission denied. Enable it in your browser site settings.", 'error');
        else if (err.code === 2) toast("GPS unavailable — try again outdoors or on a phone.", 'error');
        else toast("Couldn't read your location. Try again.", 'error');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  if (hasLocation) {
    return (
      <div style={{
        margin: '10px 15px 0',
        padding: '8px 14px',
        backgroundColor: '#0f172a',
        border: '1px solid #1f2937',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
        color: '#94a3b8',
        fontSize: '0.78rem',
        fontWeight: 700,
      }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <span>📍</span>
          <span>Pickup location set — customers see your distance.</span>
        </span>
        <button
          onClick={captureAndSave}
          disabled={busy}
          style={{
            background: 'transparent',
            border: '1px solid #334155',
            color: '#cbd5e1',
            padding: '4px 10px',
            borderRadius: '999px',
            fontWeight: 700,
            fontSize: '0.72rem',
            cursor: busy ? 'wait' : 'pointer',
          }}
        >
          {busy ? 'Updating…' : 'Update'}
        </button>
      </div>
    );
  }

  return (
    <div style={{
      margin: '10px 15px 0',
      padding: '14px 16px',
      background: 'linear-gradient(90deg, #fef3c7 0%, #fde68a 100%)',
      border: '1px solid #fbbf24',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
        <span style={{ fontSize: '1.4rem' }}>📍</span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 900, color: '#78350f', fontSize: '0.92rem' }}>
            Set your pickup location
          </div>
          <div style={{ fontSize: '0.78rem', color: '#92400e', fontWeight: 600, marginTop: '2px' }}>
            Tap while standing inside the shop so customers can see exact distance.
          </div>
        </div>
      </div>
      <button
        onClick={captureAndSave}
        disabled={busy}
        style={{
          background: '#16a34a',
          color: '#fff',
          border: 'none',
          padding: '9px 14px',
          borderRadius: '10px',
          fontWeight: 800,
          fontSize: '0.85rem',
          cursor: busy ? 'wait' : 'pointer',
          boxShadow: '0 4px 12px rgba(22,163,74,0.3)',
          whiteSpace: 'nowrap',
        }}
      >
        {busy ? 'Getting GPS…' : 'Use my current location'}
      </button>
    </div>
  );
}

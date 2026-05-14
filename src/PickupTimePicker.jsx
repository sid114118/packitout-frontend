import React, { useMemo, useState } from 'react';
import useScrollToTop from './useScrollToTop';

// Shops are assumed open until 22:00 (10 PM). No per-shop hours field exists
// in the schema yet — once one lands, swap SHOP_CLOSE_HOUR for shop.closeHour.
const SHOP_CLOSE_HOUR = 22;
// Earliest slot is now + buffer, rounded up to the next 15-min boundary.
const BUFFER_MIN = 30;
const SLOT_MIN = 15;

const fmtHHMM = (d) => {
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
};

const fmt12h = (d) => d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

// Build today's pickup slots between (now + BUFFER) and SHOP_CLOSE_HOUR.
const buildSlots = () => {
  const now = new Date();
  const start = new Date(now.getTime() + BUFFER_MIN * 60 * 1000);
  const minutes = start.getMinutes();
  const rounded = Math.ceil(minutes / SLOT_MIN) * SLOT_MIN;
  start.setMinutes(rounded, 0, 0);

  const close = new Date(now);
  close.setHours(SHOP_CLOSE_HOUR, 0, 0, 0);

  const out = [];
  const cur = new Date(start);
  while (cur < close) {
    out.push(new Date(cur));
    cur.setMinutes(cur.getMinutes() + SLOT_MIN);
  }
  return out;
};

// Combine an HH:MM string with today's date into a Date instance.
const parseCustomTime = (hhmm) => {
  if (!hhmm || !/^\d{2}:\d{2}$/.test(hhmm)) return null;
  const [h, m] = hhmm.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
};

export default function PickupTimePicker({ finalBill, onBack, onContinue }) {
  useScrollToTop();

  const slots = useMemo(() => buildSlots(), []);
  const [mode, setMode] = useState('urgent'); // 'urgent' | 'slot' | 'custom'
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [customTime, setCustomTime] = useState('');
  const [error, setError] = useState('');

  const safeFinalBill = Number(finalBill || 0);

  // Earliest/latest the custom <input type="time"> will accept.
  const customBounds = useMemo(() => {
    const now = new Date();
    const earliest = new Date(now.getTime() + BUFFER_MIN * 60 * 1000);
    const latest = new Date(now);
    latest.setHours(SHOP_CLOSE_HOUR, 0, 0, 0);
    return { min: fmtHHMM(earliest), max: fmtHHMM(latest) };
  }, []);

  const handleContinue = () => {
    setError('');
    if (mode === 'urgent') {
      onContinue({ pickupTime: null, isUrgent: true });
      return;
    }
    if (mode === 'slot') {
      if (!selectedSlot) {
        setError('Pick a time slot to continue.');
        return;
      }
      onContinue({ pickupTime: selectedSlot.toISOString(), isUrgent: false });
      return;
    }
    if (mode === 'custom') {
      const dt = parseCustomTime(customTime);
      if (!dt) {
        setError('Enter a valid time.');
        return;
      }
      const now = new Date();
      const earliest = new Date(now.getTime() + BUFFER_MIN * 60 * 1000);
      const latest = new Date(now);
      latest.setHours(SHOP_CLOSE_HOUR, 0, 0, 0);
      if (dt < earliest) {
        setError(`Pick a time after ${fmt12h(earliest)}.`);
        return;
      }
      if (dt > latest) {
        setError(`Shop closes at ${fmt12h(latest)}.`);
        return;
      }
      onContinue({ pickupTime: dt.toISOString(), isUrgent: false });
    }
  };

  const SlotChip = ({ d }) => {
    const isSelected = selectedSlot && d.getTime() === selectedSlot.getTime();
    return (
      <button
        type="button"
        onClick={() => { setMode('slot'); setSelectedSlot(d); setError(''); }}
        style={{
          padding: '10px 14px',
          borderRadius: '999px',
          border: isSelected ? '2px solid #16a34a' : '1px solid #e2e8f0',
          background: isSelected ? '#f0fdf4' : '#fff',
          color: isSelected ? '#166534' : '#0f172a',
          fontWeight: isSelected ? 800 : 600,
          fontSize: '0.85rem',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        {fmt12h(d)}
      </button>
    );
  };

  const noSlots = slots.length === 0;

  return (
    <div style={{ backgroundColor: '#f3f4f6', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif', paddingBottom: '180px' }}>

      {/* Sticky header */}
      <div style={{ position: 'sticky', top: 0, backgroundColor: 'white', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '1px solid #e5e7eb', zIndex: 100 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#111827', display: 'flex', alignItems: 'center' }}>←</button>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: 800, letterSpacing: '-0.3px' }}>Pickup Time</h2>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>When do you want to collect your items?</div>
        </div>
      </div>

      <div style={{ padding: '16px', maxWidth: '800px', margin: '0 auto' }}>

        {/* Urgent / ASAP card */}
        <button
          type="button"
          onClick={() => { setMode('urgent'); setError(''); }}
          style={{
            width: '100%',
            textAlign: 'left',
            background: mode === 'urgent' ? 'linear-gradient(135deg, #fff1f2 0%, #fee2e2 100%)' : '#fff',
            border: mode === 'urgent' ? '2px solid #ef4444' : '1px solid #e5e7eb',
            borderRadius: '16px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            cursor: 'pointer',
            marginBottom: '20px',
            boxShadow: mode === 'urgent' ? '0 6px 18px rgba(239,68,68,0.18)' : '0 2px 8px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#ef4444', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>⚡</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '1.05rem' }}>Urgent — As Soon As Possible</div>
            <div style={{ fontSize: '0.8rem', color: '#7f1d1d', marginTop: '2px', fontWeight: 600 }}>Pick up as soon as the shop packs it (~15 min).</div>
          </div>
          <div style={{
            width: '22px', height: '22px', borderRadius: '50%',
            border: mode === 'urgent' ? '6px solid #ef4444' : '2px solid #cbd5e1',
            background: mode === 'urgent' ? '#fff' : '#fff',
            flexShrink: 0,
          }} />
        </button>

        {/* Schedule a time section */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', marginBottom: '20px' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '10px' }}>
            Or schedule a pickup
          </div>

          {noSlots ? (
            <div style={{ padding: '14px', background: '#fef2f2', borderRadius: '12px', color: '#b91c1c', fontSize: '0.85rem', fontWeight: 700 }}>
              Shop is closing soon — only urgent pickup is available right now.
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
                {slots.slice(0, 16).map(d => <SlotChip key={d.getTime()} d={d} />)}
              </div>

              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, marginBottom: '8px' }}>Or pick an exact time:</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="time"
                  value={customTime}
                  min={customBounds.min}
                  max={customBounds.max}
                  onChange={(e) => { setMode('custom'); setCustomTime(e.target.value); setError(''); }}
                  style={{
                    flex: 1,
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: mode === 'custom' ? '2px solid #16a34a' : '1px solid #cbd5e1',
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: '#0f172a',
                    background: '#fff',
                    outline: 'none',
                  }}
                />
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700 }}>
                  Shop closes<br />at {fmt12h(parseCustomTime(`${SHOP_CLOSE_HOUR.toString().padStart(2, '0')}:00`))}
                </div>
              </div>
            </>
          )}
        </div>

        {error && (
          <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '10px 14px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '12px', border: '1px solid #fecaca' }}>
            {error}
          </div>
        )}

        {/* Summary of selection */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '14px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '6px' }}>Your selection</div>
          {mode === 'urgent' && (
            <div style={{ color: '#b91c1c', fontWeight: 900, fontSize: '1rem' }}>⚡ Urgent — pick up ASAP</div>
          )}
          {mode === 'slot' && selectedSlot && (
            <div style={{ color: '#0f172a', fontWeight: 900, fontSize: '1rem' }}>🕒 Pickup at {fmt12h(selectedSlot)}</div>
          )}
          {mode === 'custom' && parseCustomTime(customTime) && (
            <div style={{ color: '#0f172a', fontWeight: 900, fontSize: '1rem' }}>🕒 Pickup at {fmt12h(parseCustomTime(customTime))}</div>
          )}
          {((mode === 'slot' && !selectedSlot) || (mode === 'custom' && !parseCustomTime(customTime))) && (
            <div style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.9rem' }}>No time selected yet.</div>
          )}
        </div>
      </div>

      {/* Continue button */}
      <div style={{ position: 'fixed', bottom: '70px', left: 0, right: 0, backgroundColor: 'white', padding: '12px 16px', borderTop: '1px solid #e5e7eb', boxShadow: '0 -4px 10px rgba(0,0,0,0.03)', zIndex: 90 }}>
        <button
          onClick={handleContinue}
          style={{
            width: '100%',
            maxWidth: '800px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            backgroundColor: '#16a34a',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontWeight: 900,
            fontSize: '1.1rem',
            cursor: 'pointer',
            boxShadow: '0 8px 22px rgba(22, 163, 74, 0.32)',
          }}
        >
          <span>Continue to Payment</span>
          <span>₹{safeFinalBill.toFixed(2)} ›</span>
        </button>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';

// Single shared AudioContext — browsers limit how many a page can create, and
// using one lets the user "unlock" audio once per session.
let _ctx = null;
const getCtx = () => {
  if (typeof window === 'undefined') return null;
  if (_ctx) return _ctx;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  try { _ctx = new Ctx(); } catch (e) { return null; }
  return _ctx;
};

const beep = (freq, duration, when = 0) => {
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.value = freq;
  const t0 = ctx.currentTime + when;
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(0.35, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
};

// Two-tone chirp — distinctive enough to recognise across the room.
const chirp = () => {
  beep(880, 0.16, 0);
  beep(1320, 0.18, 0.2);
};

export function useOrderAlarm(active, opts = {}) {
  const { intervalMs = 2500 } = opts;
  const [muted, setMuted] = useState(false);
  const [needsUnlock, setNeedsUnlock] = useState(() => {
    const ctx = getCtx();
    return !ctx || ctx.state !== 'running';
  });
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!active || muted) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const fire = () => {
      const ctx = getCtx();
      if (!ctx) { setNeedsUnlock(true); return; }
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      if (ctx.state === 'running') {
        if (needsUnlock) setNeedsUnlock(false);
        chirp();
        if (navigator.vibrate) {
          try { navigator.vibrate([220, 90, 220]); } catch (e) {}
        }
      } else {
        setNeedsUnlock(true);
      }
    };

    fire();
    intervalRef.current = setInterval(fire, intervalMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [active, muted, intervalMs, needsUnlock]);

  const unlock = async () => {
    const ctx = getCtx();
    if (!ctx) return;
    try {
      await ctx.resume();
      chirp();
      setNeedsUnlock(false);
    } catch (e) {
      setNeedsUnlock(true);
    }
  };

  return { muted, setMuted, needsUnlock, unlock };
}

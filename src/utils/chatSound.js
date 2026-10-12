// Synthesized Web Audio chimes for Shop Chat & Quick Replacement.
// Zero external sound asset dependency — works offline, instantaneous, no network lag.

let audioCtx = null;

const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
};

/**
 * Friendly WhatsApp-style subtle "pop" chime for new incoming messages.
 */
export const playMessagePop = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Frequency sweeps down slightly to give a pleasant rounded pop
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(450, now + 0.08);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  } catch (e) {
    // Audio context may be blocked by autoplay policies before user interaction
  }
};

/**
 * Warm 2-tone "success" chord (C5 -> E5) when customer accepts a replacement.
 */
export const playAcceptChime = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Note 1: 523.25 Hz (C5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(523.25, now);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.25);

    // Note 2: 659.25 Hz (E5) after 90ms
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(659.25, now + 0.09);
    gain2.gain.setValueAtTime(0.28, now + 0.09);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.09);
    osc2.stop(now + 0.38);
  } catch (e) {
    // Audio policy fallback
  }
};

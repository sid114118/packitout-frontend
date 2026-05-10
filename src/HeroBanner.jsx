import React, { useEffect, useRef, useState } from 'react';

const SLIDES = [
  {
    title: 'Free Delivery',
    subtitle: 'On orders above ₹199',
    cta: 'Order now',
    emoji: '🚚',
    bg: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
    accent: 'rgba(255,255,255,0.18)',
  },
  {
    title: 'Refer & Earn 50 🪙',
    subtitle: 'Share your code, both win.',
    cta: 'Get code',
    emoji: '🎁',
    bg: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    accent: 'rgba(34,197,94,0.22)',
    hash: '#account',
  },
  {
    title: 'Snap your list',
    subtitle: 'Upload parchi, we handle the rest.',
    cta: 'Upload',
    emoji: '📸',
    bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    accent: 'rgba(255,255,255,0.18)',
  },
];

export default function HeroBanner() {
  const [active, setActive] = useState(0);
  const trackRef = useRef(null);
  const isUserScrollingRef = useRef(false);
  const userScrollTimerRef = useRef(null);

  // Auto-advance every 4s; pauses ~3s after user swipes
  useEffect(() => {
    const id = setInterval(() => {
      if (isUserScrollingRef.current) return;
      setActive(prev => {
        const next = (prev + 1) % SLIDES.length;
        const track = trackRef.current;
        if (track) {
          track.scrollTo({ left: next * track.clientWidth, behavior: 'smooth' });
        }
        return next;
      });
    }, 4000);
    return () => clearInterval(id);
  }, []);

  const handleScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    const idx = Math.round(track.scrollLeft / track.clientWidth);
    if (idx !== active) setActive(idx);

    isUserScrollingRef.current = true;
    if (userScrollTimerRef.current) clearTimeout(userScrollTimerRef.current);
    userScrollTimerRef.current = setTimeout(() => { isUserScrollingRef.current = false; }, 3000);
  };

  const goTo = (i) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: i * track.clientWidth, behavior: 'smooth' });
  };

  return (
    <div style={{ padding: '4px 12px 8px' }}>
      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="hide-scroll"
        style={{
          display: 'flex',
          gap: '0',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          borderRadius: '18px',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {SLIDES.map((s, i) => (
          <div
            key={i}
            onClick={() => { if (s.hash) window.location.hash = s.hash; }}
            style={{
              flex: '0 0 100%',
              scrollSnapAlign: 'start',
              minWidth: '100%',
              borderRadius: '18px',
              overflow: 'hidden',
              cursor: s.hash ? 'pointer' : 'default',
            }}
          >
            <div
              style={{
                background: s.bg,
                color: '#fff',
                padding: '18px 18px',
                minHeight: '116px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '14px',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div aria-hidden="true" style={{
                position: 'absolute', top: '-50px', right: '-30px',
                width: '160px', height: '160px', borderRadius: '50%',
                background: `radial-gradient(circle, ${s.accent}, rgba(255,255,255,0) 70%)`,
                pointerEvents: 'none',
              }} />
              <div style={{ position: 'relative', zIndex: 1, minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, letterSpacing: '-0.2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {s.title}
                </div>
                <div style={{ fontSize: '0.82rem', opacity: 0.92, marginTop: '4px', fontWeight: 500 }}>
                  {s.subtitle}
                </div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  marginTop: '10px', padding: '6px 12px',
                  background: 'rgba(255,255,255,0.18)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700,
                  backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
                }}>
                  {s.cta}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </div>
              <div style={{
                fontSize: '2.6rem', flexShrink: 0, position: 'relative', zIndex: 1,
                filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.18))',
              }}>{s.emoji}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '10px' }}>
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            style={{
              width: i === active ? '20px' : '6px',
              height: '6px',
              borderRadius: '999px',
              border: 'none',
              background: i === active ? '#16a34a' : '#cbd5e1',
              transition: 'width 0.25s ease, background 0.25s ease',
              cursor: 'pointer',
              padding: 0,
            }}
          />
        ))}
      </div>
    </div>
  );
}

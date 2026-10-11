import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function ShopWelcomeModal() {
  const [welcomeData, setWelcomeData] = useState(null);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const handleShowWelcome = (e) => {
      if (e.detail && e.detail.name) {
        setIsClosing(false);
        setWelcomeData(e.detail);
      }
    };

    window.addEventListener('SHOW_SHOP_WELCOME', handleShowWelcome);
    return () => window.removeEventListener('SHOW_SHOP_WELCOME', handleShowWelcome);
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setWelcomeData(null);
      setIsClosing(false);
    }, 380);
  };

  useEffect(() => {
    if (!welcomeData) return;
    const timer = setTimeout(() => {
      handleClose();
    }, 3200);
    return () => clearTimeout(timer);
  }, [welcomeData]);

  if (!welcomeData) return null;

  const { name, pincode, isOpen } = welcomeData;

  // Staggered celebration particles for lively celebratory atmosphere
  const particles = [
    { emoji: '✨', left: '10%', top: '14%', delay: '0s', dur: '2.6s', size: '1.5rem' },
    { emoji: '🎉', left: '86%', top: '16%', delay: '0.2s', dur: '3.1s', size: '1.8rem' },
    { emoji: '⭐', left: '20%', top: '26%', delay: '0.4s', dur: '2.4s', size: '1.3rem' },
    { emoji: '🎊', left: '80%', top: '32%', delay: '0.15s', dur: '2.9s', size: '1.6rem' },
    { emoji: '🌟', left: '6%', top: '55%', delay: '0.5s', dur: '2.8s', size: '1.4rem' },
    { emoji: '✨', left: '90%', top: '60%', delay: '0.3s', dur: '2.5s', size: '1.5rem' },
    { emoji: '💫', left: '15%', top: '78%', delay: '0.6s', dur: '3.2s', size: '1.4rem' },
    { emoji: '🎉', left: '84%', top: '82%', delay: '0.25s', dur: '2.7s', size: '1.7rem' },
    { emoji: '⭐', left: '48%', top: '8%', delay: '0.45s', dur: '2.3s', size: '1.3rem' },
  ];

  return createPortal(
    <div
      onClick={handleClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 50% 40%, rgba(16, 185, 129, 0.32) 0%, rgba(15, 23, 42, 0.95) 68%, #070b14 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        padding: '20px',
        animation: isClosing ? 'welcomeFadeOut 0.38s cubic-bezier(0.4, 0, 1, 1) forwards' : 'welcomeFadeIn 0.35s cubic-bezier(0, 0, 0.2, 1) forwards',
        cursor: 'pointer',
        userSelect: 'none',
        overflow: 'hidden'
      }}
    >
      <style>{`
        @keyframes welcomeFadeIn {
          from { opacity: 0; backdrop-filter: blur(0px); }
          to { opacity: 1; backdrop-filter: blur(20px); }
        }
        @keyframes welcomeFadeOut {
          from { opacity: 1; transform: scale(1); }
          to { opacity: 0; transform: scale(1.06); filter: blur(4px); }
        }
        @keyframes welcomeCardSpring {
          0% {
            transform: scale(0.72) translateY(50px);
            opacity: 0;
            filter: blur(6px);
          }
          65% {
            transform: scale(1.03) translateY(-4px);
            opacity: 1;
            filter: blur(0);
          }
          85% {
            transform: scale(0.99) translateY(1px);
          }
          100% {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
        }
        @keyframes haloRotatePulse {
          0% { transform: scale(0.95) rotate(0deg); opacity: 0.55; }
          50% { transform: scale(1.18) rotate(180deg); opacity: 0.85; }
          100% { transform: scale(0.95) rotate(360deg); opacity: 0.55; }
        }
        @keyframes shopEmblemFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-7px) scale(1.02); }
        }
        @keyframes particleFloatDrift {
          0% { transform: translateY(0) scale(0.8) rotate(0deg); opacity: 0; }
          25% { opacity: 1; transform: translateY(-12px) scale(1.1) rotate(6deg); }
          75% { opacity: 0.9; transform: translateY(-28px) scale(1) rotate(-6deg); }
          100% { transform: translateY(-44px) scale(0.85) rotate(15deg); opacity: 0; }
        }
        @keyframes buttonShimmerSweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes countdownTimerFill {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>

      {/* 🔮 AMBIENT BACKGROUND GLOW ORBS */}
      <div
        style={{
          position: 'absolute',
          top: '25%',
          left: '20%',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.35) 0%, rgba(16, 185, 129, 0) 70%)',
          filter: 'blur(45px)',
          pointerEvents: 'none'
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '20%',
          right: '20%',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.22) 0%, rgba(245, 158, 11, 0) 70%)',
          filter: 'blur(50px)',
          pointerEvents: 'none'
        }}
      />

      {/* 🎊 CELEBRATORY FLOATING PARTICLES */}
      {particles.map((p, idx) => (
        <span
          key={idx}
          style={{
            position: 'absolute',
            left: p.left,
            top: p.top,
            fontSize: p.size,
            pointerEvents: 'none',
            animation: `particleFloatDrift ${p.dur} infinite ease-in-out ${p.delay}`
          }}
        >
          {p.emoji}
        </span>
      ))}

      {/* 🌟 CENTER SHOWCASE CARD */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          border: '1.5px solid rgba(255, 255, 255, 0.22)',
          borderRadius: '36px',
          padding: '40px 26px 30px',
          textAlign: 'center',
          boxShadow: '0 30px 80px -15px rgba(0, 0, 0, 0.75), 0 0 50px rgba(16, 185, 129, 0.28), inset 0 1px 2px rgba(255, 255, 255, 0.3)',
          animation: 'welcomeCardSpring 0.55s cubic-bezier(0.175, 0.885, 0.32, 1.25) forwards',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          color: '#ffffff',
          overflow: 'hidden'
        }}
      >
        {/* TOP GLOW LIGHT ACCENT */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '15%',
            right: '15%',
            height: '2px',
            background: 'linear-gradient(90deg, transparent, #34d399, transparent)',
            boxShadow: '0 0 12px #34d399'
          }}
        />

        {/* ROTATING PULSE HALO BEHIND STORE EMBLEM */}
        <div
          style={{
            position: 'absolute',
            top: '25px',
            width: '140px',
            height: '140px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.7) 0%, rgba(5, 150, 105, 0.2) 60%, transparent 70%)',
            animation: 'haloRotatePulse 4s infinite ease-in-out',
            pointerEvents: 'none',
            zIndex: 0
          }}
        />

        {/* 🏬 STORE ICON EMBLEM */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            width: '96px',
            height: '96px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #34d399 0%, #059669 60%, #047857 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 12px 30px rgba(16, 185, 129, 0.45), inset 0 2px 4px rgba(255,255,255,0.5)',
            marginBottom: '18px',
            animation: 'shopEmblemFloat 2.6s infinite ease-in-out'
          }}
        >
          <span style={{ fontSize: '3rem', lineHeight: 1 }}>🏬</span>
          <div
            style={{
              position: 'absolute',
              bottom: '1px',
              right: '1px',
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              border: '2.5px solid #ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.9rem',
              color: '#ffffff',
              fontWeight: '900',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
            }}
          >
            ✓
          </div>
        </div>

        {/* 📍 PINCODE BADGE */}
        {pincode ? (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.24)',
              color: '#a7f3d0',
              padding: '5px 16px',
              borderRadius: '24px',
              fontSize: '0.8rem',
              fontWeight: '800',
              letterSpacing: '0.6px',
              marginBottom: '14px',
              textTransform: 'uppercase',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }}
          >
            <span>📍</span>
            <span>Delivering in {pincode}</span>
          </div>
        ) : (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.24)',
              color: '#a7f3d0',
              padding: '5px 16px',
              borderRadius: '24px',
              fontSize: '0.8rem',
              fontWeight: '800',
              letterSpacing: '0.6px',
              marginBottom: '14px',
              textTransform: 'uppercase'
            }}
          >
            <span>✨</span>
            <span>Verified Local Partner</span>
          </div>
        )}

        {/* WELCOME TO EYEBROW */}
        <div
          style={{
            fontSize: '0.95rem',
            fontWeight: '800',
            color: '#cbd5e1',
            letterSpacing: '3.5px',
            textTransform: 'uppercase',
            marginBottom: '8px'
          }}
        >
          Welcome to
        </div>

        {/* 🔥 BIG PROUD SHOP NAME */}
        <h1
          style={{
            margin: '0 0 16px 0',
            fontSize: 'clamp(2.4rem, 8vw, 3.4rem)',
            fontWeight: '900',
            color: '#ffffff',
            lineHeight: 1.15,
            letterSpacing: '-0.5px',
            textShadow: '0 4px 30px rgba(16, 185, 129, 0.65), 0 2px 6px rgba(0,0,0,0.6)',
            maxWidth: '100%',
            wordBreak: 'break-word',
            padding: '0 4px'
          }}
        >
          {name}
        </h1>

        {/* STATUS BADGE */}
        <div style={{ marginBottom: '22px' }}>
          {isOpen !== false ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(16, 185, 129, 0.22)',
                border: '1px solid #10b981',
                color: '#34d399',
                padding: '6px 18px',
                borderRadius: '14px',
                fontSize: '0.84rem',
                fontWeight: '800',
                boxShadow: '0 2px 10px rgba(16, 185, 129, 0.2)'
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }} />
              Open for Orders • Fresh Local Products
            </span>
          ) : (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.22)',
                border: '1px solid #ef4444',
                color: '#fca5a5',
                padding: '6px 18px',
                borderRadius: '14px',
                fontSize: '0.84rem',
                fontWeight: '800'
              }}
            >
              🌙 Store is currently closed
            </span>
          )}
        </div>

        {/* SUBTITLE GREETING */}
        <p
          style={{
            margin: '0 0 26px 0',
            fontSize: '0.9rem',
            color: '#94a3b8',
            lineHeight: '1.45',
            maxWidth: '340px',
            fontWeight: '500'
          }}
        >
          Explore fresh groceries, daily essentials & exclusive offers curated for you.
        </p>

        {/* 🛒 START SHOPPING ACTION BUTTON */}
        <button
          onClick={handleClose}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '330px',
            padding: '16px 26px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '18px',
            fontSize: '1.1rem',
            fontWeight: '800',
            letterSpacing: '0.4px',
            cursor: 'pointer',
            boxShadow: '0 12px 30px rgba(16, 185, 129, 0.45), inset 0 1px 2px rgba(255,255,255,0.4)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            overflow: 'hidden'
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.97)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          {/* SHIMMER LIGHT BAR */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '50%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.25), transparent)',
              transform: 'skewX(-20deg)',
              animation: 'buttonShimmerSweep 2.2s infinite ease-in-out',
              pointerEvents: 'none'
            }}
          />
          <span>Start Shopping</span>
          <span style={{ fontSize: '1.25rem' }}>🛒</span>
        </button>

        {/* AUTO-DISMISS COUNTDOWN PROGRESS INDICATOR */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '3px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)'
          }}
        >
          <div
            style={{
              height: '100%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 8px #10b981',
              animation: 'countdownTimerFill 3.2s linear forwards'
            }}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}

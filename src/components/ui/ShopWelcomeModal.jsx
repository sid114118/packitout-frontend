import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cdnImage } from '../../utils/cloudinaryUrl.js';

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

  const { name, pincode, isOpen, shopImage } = welcomeData;

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
        background: 'radial-gradient(circle at 50% 40%, rgba(255, 71, 87, 0.42) 0%, rgba(15, 23, 42, 0.94) 70%, #080c14 100%)',
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
        @keyframes shopNameZoomInFocus {
          0% {
            transform: scale(0.35) translateY(24px);
            opacity: 0;
            filter: blur(10px);
            letter-spacing: -2px;
          }
          65% {
            transform: scale(1.14) translateY(-3px);
            opacity: 1;
            filter: blur(0);
            letter-spacing: 0px;
          }
          85% {
            transform: scale(0.97) translateY(1px);
          }
          100% {
            transform: scale(1) translateY(0);
            opacity: 1;
            filter: blur(0);
            letter-spacing: -0.5px;
          }
        }
        @keyframes shopNameGlowPulse {
          0%, 100% {
            text-shadow: 0 4px 20px rgba(0, 0, 0, 0.45), 0 0 25px rgba(34, 197, 94, 0.55);
          }
          50% {
            text-shadow: 0 4px 25px rgba(0, 0, 0, 0.6), 0 0 35px rgba(74, 222, 128, 0.9), 0 0 10px #ffffff;
          }
        }
      `}</style>

      {/* 🔮 AMBIENT BACKGROUND GLOW ORBS (Upload Parchi Coral / Warm Rose Palette) */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '18%',
          width: '340px',
          height: '340px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 107, 107, 0.45) 0%, rgba(255, 71, 87, 0) 70%)',
          filter: 'blur(50px)',
          pointerEvents: 'none'
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '20%',
          right: '18%',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 71, 87, 0.35) 0%, rgba(255, 107, 107, 0) 70%)',
          filter: 'blur(55px)',
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

      {/* 🌟 CENTER SHOWCASE CARD WITH EXACT "UPLOAD PARCHI" GRADIENT */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '460px',
          background: 'linear-gradient(135deg, #ff6b6b 0%, #ff4757 100%)',
          border: '1.5px solid rgba(255, 255, 255, 0.32)',
          borderRadius: '36px',
          padding: '40px 26px 30px',
          textAlign: 'center',
          boxShadow: '0 30px 80px -10px rgba(255, 71, 87, 0.55), 0 0 50px rgba(255, 107, 107, 0.35), inset 0 1px 2px rgba(255, 255, 255, 0.45)',
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
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.9), transparent)',
            boxShadow: '0 0 12px rgba(255, 255, 255, 0.8)'
          }}
        />

        {/* DECORATIVE LIGHT RADIAL BUBBLE IN CARD CORNER */}
        <div
          style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.22) 0%, transparent 70%)',
            pointerEvents: 'none'
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
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.1) 60%, transparent 70%)',
            animation: 'haloRotatePulse 4s infinite ease-in-out',
            pointerEvents: 'none',
            zIndex: 0
          }}
        />

        {/* 🏬 STORE ICON / IMAGE EMBLEM */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #ffffff 0%, #fff1f2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.25), inset 0 2px 4px rgba(255, 255, 255, 0.8)',
            marginBottom: '18px',
            animation: 'shopEmblemFloat 2.6s infinite ease-in-out',
            border: '3px solid #ffffff'
          }}
        >
          {shopImage ? (
            <img
              src={cdnImage(shopImage, 300)}
              alt={name}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                objectFit: 'cover'
              }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.nextSibling) {
                  e.currentTarget.nextSibling.style.display = 'block';
                }
              }}
            />
          ) : null}
          <span
            style={{
              fontSize: '3rem',
              lineHeight: 1,
              display: shopImage ? 'none' : 'block'
            }}
          >
            🏬
          </span>
          <div
            style={{
              position: 'absolute',
              bottom: '1px',
              right: '1px',
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              border: '2.5px solid #ff4757',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.9rem',
              color: '#ff4757',
              fontWeight: '900',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              zIndex: 2
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
              backgroundColor: 'rgba(255, 255, 255, 0.22)',
              border: '1px solid rgba(255, 255, 255, 0.38)',
              color: '#ffffff',
              padding: '5px 16px',
              borderRadius: '24px',
              fontSize: '0.8rem',
              fontWeight: '800',
              letterSpacing: '0.6px',
              marginBottom: '14px',
              textTransform: 'uppercase',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
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
              backgroundColor: 'rgba(255, 255, 255, 0.22)',
              border: '1px solid rgba(255, 255, 255, 0.38)',
              color: '#ffffff',
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
            color: 'rgba(255, 255, 255, 0.9)',
            letterSpacing: '3.5px',
            textTransform: 'uppercase',
            marginBottom: '8px'
          }}
        >
          Welcome to
        </div>

        {/* 🔥 BIG PROUD SHOP NAME (GREEN COLOR WITH ZOOM-IN FOCUS ANIMATION) */}
        <h1
          style={{
            margin: '0 0 16px 0',
            fontSize: 'clamp(2.3rem, 7.8vw, 3.3rem)',
            fontWeight: '900',
            color: '#22c55e',
            lineHeight: 1.15,
            letterSpacing: '-0.5px',
            textShadow: '0 4px 20px rgba(0, 0, 0, 0.45), 0 0 25px rgba(34, 197, 94, 0.55)',
            maxWidth: '100%',
            wordBreak: 'break-word',
            padding: '0 4px',
            display: 'inline-block',
            transformOrigin: 'center center',
            animation: 'shopNameZoomInFocus 0.65s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.18s backwards, shopNameGlowPulse 2.4s ease-in-out 0.85s infinite'
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
                backgroundColor: 'rgba(255, 255, 255, 0.22)',
                border: '1px solid rgba(255, 255, 255, 0.45)',
                color: '#ffffff',
                padding: '6px 18px',
                borderRadius: '14px',
                fontSize: '0.84rem',
                fontWeight: '800',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.12)'
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ffffff', display: 'inline-block', boxShadow: '0 0 8px #ffffff' }} />
              Open for Orders • Fresh Local Products
            </span>
          ) : (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: '#ffffff',
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
            color: 'rgba(255, 255, 255, 0.95)',
            lineHeight: '1.45',
            maxWidth: '340px',
            fontWeight: '600'
          }}
        >
          Explore fresh groceries, daily essentials & exclusive offers curated for you.
        </p>

        {/* 🛒 START SHOPPING ACTION BUTTON (White button with #ff4757 text matching Upload Parchi) */}
        <button
          onClick={handleClose}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '330px',
            padding: '16px 26px',
            backgroundColor: '#ffffff',
            color: '#ff4757',
            border: 'none',
            borderRadius: '18px',
            fontSize: '1.1rem',
            fontWeight: '900',
            letterSpacing: '0.4px',
            cursor: 'pointer',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.22), 0 2px 6px rgba(0, 0, 0, 0.1)',
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
              background: 'linear-gradient(90deg, transparent, rgba(255, 71, 87, 0.18), transparent)',
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
            height: '3.5px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)'
          }}
        >
          <div
            style={{
              height: '100%',
              backgroundColor: '#ffffff',
              boxShadow: '0 0 8px rgba(255, 255, 255, 0.8)',
              animation: 'countdownTimerFill 3.2s linear forwards'
            }}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { createSpeechRecognition, cleanVoiceSearchQuery, isSpeechRecognitionSupported } from '../utils/voiceSearchCleaner.js';

export default function VoiceSearchModal({ isOpen, onClose, onSearch }) {
  const [lang, setLang] = useState('en-IN'); // 'en-IN' (Hinglish/English) or 'hi-IN' (Hindi)
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [processedResult, setProcessedResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const recognitionRef = useRef(null);
  const finishTimeoutRef = useRef(null);

  // Stop recognition on unmount or close
  useEffect(() => {
    if (!isOpen) {
      stopListening();
      setLiveTranscript('');
      setProcessedResult(null);
      setErrorMessage(null);
    } else {
      startListening();
    }
    return () => {
      stopListening();
    };
  }, [isOpen, lang]);

  const startListening = () => {
    if (!isSpeechRecognitionSupported()) {
      setErrorMessage("Voice search is not supported on this browser. Please use Chrome or Android app.");
      return;
    }

    setErrorMessage(null);
    setLiveTranscript('');
    setProcessedResult(null);

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }

      const recognition = createSpeechRecognition({ lang });
      if (!recognition) {
        setErrorMessage("Could not initialize microphone.");
        return;
      }

      recognitionRef.current = recognition;

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage(null);
      };

      recognition.onresult = (event) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript;
          } else {
            interim += transcript;
          }
        }

        const currentSpeech = final || interim;
        setLiveTranscript(currentSpeech);

        if (final) {
          handleFinalSpeech(final);
        }
      };

      recognition.onerror = (event) => {
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setErrorMessage("Microphone permission denied. Please allow microphone access in your browser settings.");
        } else if (event.error === 'no-speech') {
          setErrorMessage("Didn't catch that. Tap the mic to try again!");
        } else if (event.error === 'network') {
          setErrorMessage("Network issue with speech recognition. Check your connection.");
        } else {
          setErrorMessage("Couldn't hear clearly. Please try again.");
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error("Speech recognition start failed:", err);
      setIsListening(false);
      setErrorMessage("Could not access microphone.");
    }
  };

  const stopListening = () => {
    clearTimeout(finishTimeoutRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const handleFinalSpeech = (rawText) => {
    stopListening();
    const result = cleanVoiceSearchQuery(rawText);
    setProcessedResult(result);

    // Give the user a moment to see what was understood and cleaned, then apply
    finishTimeoutRef.current = setTimeout(() => {
      onSearch(result.clean);
      onClose();
    }, 700);
  };

  const handleManualApply = () => {
    const queryToApply = processedResult ? processedResult.clean : (liveTranscript ? cleanVoiceSearchQuery(liveTranscript).clean : '');
    if (queryToApply) {
      stopListening();
      onSearch(queryToApply);
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 9999999,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        animation: 'pioFadeIn 0.2s ease-out',
        padding: '0',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          stopListening();
          onClose();
        }
      }}
    >
      <style>{`
        @keyframes pioFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pioSlideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes pioPulseRing {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.5); }
          70% { transform: scale(1.08); box-shadow: 0 0 0 25px rgba(22, 163, 74, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(22, 163, 74, 0); }
        }
        @keyframes pioPulseRingRed {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 20px rgba(239, 68, 68, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        @keyframes pioSoundWave {
          0%, 100% { height: 8px; }
          50% { height: 28px; }
        }
      `}</style>

      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          backgroundColor: '#ffffff',
          borderTopLeftRadius: '28px',
          borderTopRightRadius: '28px',
          padding: '24px 20px 32px',
          boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          animation: 'pioSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative',
        }}
      >
        {/* Grabber Bar */}
        <div style={{ width: '42px', height: '4px', backgroundColor: '#e2e8f0', borderRadius: '999px', marginBottom: '18px' }} />

        {/* Close Button */}
        <button
          onClick={() => { stopListening(); onClose(); }}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: '#f1f5f9',
            border: 'none',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '1.1rem',
            fontWeight: 'bold',
          }}
          aria-label="Close"
        >
          ✕
        </button>

        {/* Header Title */}
        <div style={{ textAlign: 'center', marginBottom: '18px' }}>
          <h2 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
            {isListening ? "Listening… बोलिए" : "Voice Search"}
          </h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
            Speak what you want in Hindi or English
          </p>
        </div>

        {/* Language Switcher Chips */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', backgroundColor: '#f8fafc', padding: '4px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <button
            onClick={() => { setLang('en-IN'); }}
            style={{
              padding: '6px 14px',
              borderRadius: '9px',
              border: 'none',
              backgroundColor: lang === 'en-IN' ? '#16a34a' : 'transparent',
              color: lang === 'en-IN' ? '#ffffff' : '#64748b',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            🇮🇳 Hinglish / English
          </button>
          <button
            onClick={() => { setLang('hi-IN'); }}
            style={{
              padding: '6px 14px',
              borderRadius: '9px',
              border: 'none',
              backgroundColor: lang === 'hi-IN' ? '#16a34a' : 'transparent',
              color: lang === 'hi-IN' ? '#ffffff' : '#64748b',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            🇮🇳 हिंदी (Hindi)
          </button>
        </div>

        {/* Animated Microphone Area */}
        <div style={{ position: 'relative', width: '110px', height: '110px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '22px' }}>
          {isListening && (
            <div
              style={{
                position: 'absolute',
                width: '90px',
                height: '90px',
                borderRadius: '50%',
                backgroundColor: 'rgba(22, 163, 74, 0.15)',
                animation: 'pioPulseRing 1.8s infinite ease-out',
              }}
            />
          )}

          <button
            onClick={() => {
              if (isListening) stopListening();
              else startListening();
            }}
            className="pio-press"
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: isListening ? '#16a34a' : (errorMessage ? '#ef4444' : '#0f172a'),
              border: 'none',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: isListening ? '0 8px 24px rgba(22, 163, 74, 0.35)' : '0 8px 20px rgba(15, 23, 42, 0.2)',
              position: 'relative',
              zIndex: 2,
              transition: 'all 0.3s ease',
            }}
          >
            {isListening ? (
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            ) : (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            )}
          </button>
        </div>

        {/* Live Audio Visualizer Bars (when listening) */}
        {isListening && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', height: '30px', marginBottom: '14px' }}>
            <span style={{ width: '4px', backgroundColor: '#16a34a', borderRadius: '4px', animation: 'pioSoundWave 0.8s infinite ease-in-out 0.1s' }} />
            <span style={{ width: '4px', backgroundColor: '#16a34a', borderRadius: '4px', animation: 'pioSoundWave 0.9s infinite ease-in-out 0.3s' }} />
            <span style={{ width: '4px', backgroundColor: '#16a34a', borderRadius: '4px', animation: 'pioSoundWave 0.7s infinite ease-in-out 0.2s' }} />
            <span style={{ width: '4px', backgroundColor: '#16a34a', borderRadius: '4px', animation: 'pioSoundWave 1.0s infinite ease-in-out 0.4s' }} />
            <span style={{ width: '4px', backgroundColor: '#16a34a', borderRadius: '4px', animation: 'pioSoundWave 0.8s infinite ease-in-out 0.1s' }} />
          </div>
        )}

        {/* Live Speech Feedback Display */}
        <div style={{ minHeight: '64px', width: '100%', textAlign: 'center', padding: '0 12px' }}>
          {liveTranscript ? (
            <div>
              <p style={{ margin: '0 0 6px', fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.4 }}>
                "{liveTranscript}"
              </p>
              {processedResult && processedResult.isModified && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '4px 10px', borderRadius: '999px', fontSize: '0.82rem', color: '#15803d', fontWeight: 600 }}>
                  <span>🎯 Smart Search:</span>
                  <span style={{ fontWeight: 800 }}>"{processedResult.clean}"</span>
                </div>
              )}
            </div>
          ) : errorMessage ? (
            <div style={{ color: '#ef4444', fontSize: '0.9rem', fontWeight: 600 }}>
              {errorMessage}
              <div style={{ marginTop: '6px' }}>
                <button
                  onClick={startListening}
                  style={{ background: 'none', border: 'none', color: '#16a34a', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer', fontSize: '0.88rem' }}
                >
                  Tap to try again
                </button>
              </div>
            </div>
          ) : (
            <div style={{ color: '#94a3b8', fontSize: '0.92rem', fontStyle: 'italic' }}>
              Try saying: "Bhaiya 2 packet Maggi", "Amul milk", "5kg Atta"…
            </div>
          )}
        </div>

        {/* Action Button (if manual confirmation needed) */}
        {liveTranscript && (
          <div style={{ width: '100%', marginTop: '16px' }}>
            <button
              onClick={handleManualApply}
              style={{
                width: '100%',
                padding: '13px',
                backgroundColor: '#16a34a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '14px',
                fontWeight: 800,
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: '0 6px 18px rgba(22, 163, 74, 0.28)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <span>Search Now</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

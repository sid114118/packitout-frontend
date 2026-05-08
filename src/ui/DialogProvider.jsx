import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const DialogContext = createContext(null);

export function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog must be used inside <DialogProvider>');
  return ctx;
}

export const useToast = () => useDialog().toast;
export const useConfirm = () => useDialog().confirm;
export const usePrompt = () => useDialog().prompt;

let toastIdSeq = 0;

export default function DialogProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);
  const [promptState, setPromptState] = useState(null);
  const [promptValue, setPromptValue] = useState('');
  const promptInputRef = useRef(null);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message, type = 'success', durationMs = 3000) => {
    const id = ++toastIdSeq;
    setToasts((prev) => [...prev, { id, message, type }]);
    if (durationMs > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, durationMs);
    }
    return id;
  }, []);

  const confirm = useCallback((opts) => {
    const config = typeof opts === 'string' ? { message: opts } : (opts || {});
    return new Promise((resolve) => {
      setConfirmState({
        title: config.title || 'Are you sure?',
        message: config.message || '',
        confirmText: config.confirmText || 'Confirm',
        cancelText: config.cancelText || 'Cancel',
        danger: config.danger !== false,
        resolve,
      });
    });
  }, []);

  const prompt = useCallback((opts) => {
    const config = typeof opts === 'string' ? { message: opts } : (opts || {});
    return new Promise((resolve) => {
      setPromptValue(config.defaultValue ?? '');
      setPromptState({
        title: config.title || 'Enter a value',
        message: config.message || '',
        placeholder: config.placeholder || '',
        confirmText: config.confirmText || 'OK',
        cancelText: config.cancelText || 'Cancel',
        inputType: config.inputType || 'text',
        inputMode: config.inputMode || undefined,
        resolve,
      });
    });
  }, []);

  useEffect(() => {
    if (promptState && promptInputRef.current) {
      promptInputRef.current.focus();
      promptInputRef.current.select?.();
    }
  }, [promptState]);

  useEffect(() => {
    if (!confirmState && !promptState) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (confirmState) { confirmState.resolve(false); setConfirmState(null); }
        if (promptState) { promptState.resolve(null); setPromptState(null); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [confirmState, promptState]);

  const value = useMemo(() => ({ toast, confirm, prompt }), [toast, confirm, prompt]);

  const closeConfirm = (result) => {
    if (confirmState) confirmState.resolve(result);
    setConfirmState(null);
  };

  const closePrompt = (result) => {
    if (promptState) promptState.resolve(result);
    setPromptState(null);
  };

  return (
    <DialogContext.Provider value={value}>
      {children}

      <div style={{ position: 'fixed', top: 25, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, zIndex: 2147483646, pointerEvents: 'none' }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            onClick={() => removeToast(t.id)}
            style={{
              pointerEvents: 'auto',
              backgroundColor: toastBg(t.type),
              color: 'white',
              padding: '12px 22px',
              borderRadius: 14,
              fontWeight: 700,
              fontSize: '0.95rem',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              maxWidth: 'calc(100vw - 32px)',
              cursor: 'pointer',
              animation: 'pkio_toast_in 0.28s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
            }}
            role="status"
            aria-live="polite"
          >
            <span aria-hidden="true">{toastIcon(t.type)}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {confirmState && (
        <DialogShell onBackdrop={() => closeConfirm(false)}>
          <h3 style={titleStyle}>{confirmState.title}</h3>
          {confirmState.message && <p style={messageStyle}>{confirmState.message}</p>}
          <div style={buttonRow}>
            <button onClick={() => closeConfirm(false)} style={cancelBtn}>{confirmState.cancelText}</button>
            <button onClick={() => closeConfirm(true)} style={confirmState.danger ? dangerBtn : primaryBtn} autoFocus>
              {confirmState.confirmText}
            </button>
          </div>
        </DialogShell>
      )}

      {promptState && (
        <DialogShell onBackdrop={() => closePrompt(null)}>
          <h3 style={titleStyle}>{promptState.title}</h3>
          {promptState.message && <p style={messageStyle}>{promptState.message}</p>}
          <form
            onSubmit={(e) => { e.preventDefault(); closePrompt(promptValue); }}
            style={{ width: '100%' }}
          >
            <input
              ref={promptInputRef}
              type={promptState.inputType}
              inputMode={promptState.inputMode}
              value={promptValue}
              onChange={(e) => setPromptValue(e.target.value)}
              placeholder={promptState.placeholder}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '12px 14px',
                marginBottom: 18,
                border: '1px solid #cbd5e1',
                borderRadius: 12,
                fontSize: '1rem',
                outline: 'none',
              }}
            />
            <div style={buttonRow}>
              <button type="button" onClick={() => closePrompt(null)} style={cancelBtn}>{promptState.cancelText}</button>
              <button type="submit" style={primaryBtn}>{promptState.confirmText}</button>
            </div>
          </form>
        </DialogShell>
      )}

      <style>{`
        @keyframes pkio_toast_in { from { transform: translateY(-80px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes pkio_dialog_in { from { transform: scale(0.92); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes pkio_backdrop_in { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </DialogContext.Provider>
  );
}

function DialogShell({ children, onBackdrop }) {
  return (
    <div
      onClick={onBackdrop}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15,23,42,0.55)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        zIndex: 2147483647,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        animation: 'pkio_backdrop_in 0.2s ease-out',
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'white',
          width: '100%',
          maxWidth: 340,
          padding: 24,
          borderRadius: 20,
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          animation: 'pkio_dialog_in 0.22s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

function toastBg(type) {
  if (type === 'error') return '#ef4444';
  if (type === 'info') return '#0f172a';
  if (type === 'warn') return '#f59e0b';
  return '#16a34a';
}

function toastIcon(type) {
  if (type === 'error') return '❌';
  if (type === 'info') return 'ℹ️';
  if (type === 'warn') return '⚠️';
  return '✅';
}

const titleStyle = { margin: '0 0 10px 0', fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' };
const messageStyle = { margin: '0 0 20px 0', color: '#475569', fontSize: '0.95rem', lineHeight: 1.5, fontWeight: 500, whiteSpace: 'pre-wrap' };
const buttonRow = { display: 'flex', gap: 10, width: '100%' };
const baseBtn = { flex: 1, padding: 12, borderRadius: 12, fontWeight: 800, cursor: 'pointer', fontSize: '0.95rem', border: 'none' };
const cancelBtn = { ...baseBtn, border: '1px solid #e2e8f0', background: 'white', color: '#475569', fontWeight: 700 };
const primaryBtn = { ...baseBtn, background: '#16a34a', color: 'white' };
const dangerBtn = { ...baseBtn, background: '#ef4444', color: 'white' };

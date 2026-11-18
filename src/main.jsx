import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import DialogProvider from './ui/DialogProvider.jsx'
import { RankingProvider } from './ui/RankingProvider.jsx'
import './styles.css'

class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Critical Root Exception:", error, errorInfo);
    // Automatic recovery for chunk load failure in Vite SPAs
    const msg = error?.message || error?.toString() || '';
    if (msg.includes('Failed to fetch dynamically imported module') || msg.includes('Importing a module script failed')) {
      const lastReload = sessionStorage.getItem('pio_chunk_reload');
      if (!lastReload || Date.now() - Number(lastReload) > 10000) {
        sessionStorage.setItem('pio_chunk_reload', String(Date.now()));
        window.location.reload(true);
      }
    }
  }

  handleReload = () => {
    window.location.reload(true);
  };

  handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {}
    window.location.href = window.location.origin + window.location.pathname;
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8fafc',
          padding: '20px',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            maxWidth: '440px',
            width: '100%',
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            padding: '28px 24px',
            boxShadow: '0 10px 25px rgba(15,23,42,0.08)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 16px',
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
              We'll be right back
            </h2>
            <p style={{ margin: '0 0 20px', fontSize: '0.9rem', color: '#64748b', lineHeight: 1.5 }}>
              The app hit a temporary snag while loading. Tap below to reload fresh.
            </p>
            <button
              onClick={this.handleReload}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: '#16a34a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(22, 163, 74, 0.28)',
                marginBottom: '10px'
              }}
            >
              🔄 Reload App
            </button>
            <button
              onClick={this.handleReset}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#ffffff',
                color: '#475569',
                border: '1px solid #cbd5e1',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              🧹 Clear Storage & Restart
            </button>
            {this.state.error && (
              <details style={{ marginTop: '16px', textAlign: 'left', fontSize: '0.75rem', color: '#94a3b8' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Error Details</summary>
                <pre style={{ marginTop: '6px', padding: '8px', backgroundColor: '#f1f5f9', borderRadius: '8px', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
                  {this.state.error?.message || String(this.state.error)}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <DialogProvider>
        <RankingProvider>
          <App />
        </RankingProvider>
      </DialogProvider>
    </RootErrorBoundary>
  </React.StrictMode>,
)

 

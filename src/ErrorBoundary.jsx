import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  // This catches the crash before it hits the screen
  static getDerivedStateFromError(error) {
    return { hasError: true, error: error };
  }

  // This logs the crash so you can see it in your console
  componentDidCatch(error, errorInfo) {
    console.error("🚨 REACT CRASH CAUGHT BY BOUNDARY 🚨", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // 🌟 THIS IS THE FALLBACK UI THE USER SEES 🌟
      return (
        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#fef2f2', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ color: '#b91c1c', margin: '0 0 10px', fontWeight: '900', fontSize: '1.5rem' }}>
            Oops! Something broke.
          </h2>
          <p style={{ color: '#7f1d1d', margin: '0 0 24px', fontSize: '0.95rem' }}>
            There was an issue loading this data. Don't worry, your cart is safe!
          </p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ padding: '14px 32px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 10px rgba(220, 38, 38, 0.2)' }}
          >
            Refresh App
          </button>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;

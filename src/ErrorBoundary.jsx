import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    // Added errorInfo to the state
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error: error };
  }

  componentDidCatch(error, errorInfo) {
    // Save the error info so we can show it on the phone screen!
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', backgroundColor: '#fef2f2', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '10px' }}>⚠️</div>
          <h2 style={{ color: '#b91c1c', margin: '0 0 10px', fontWeight: '900', fontSize: '1.5rem', textAlign: 'center' }}>
            Oops! Something broke.
          </h2>
          
          {/* 📱 THIS IS THE NEW PART FOR MOBILE DEBUGGING 📱 */}
          <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '8px', width: '100%', maxWidth: '400px', border: '1px solid #fca5a5', marginBottom: '20px', overflowX: 'auto', textAlign: 'left' }}>
            <p style={{ color: '#991b1b', fontWeight: 'bold', margin: '0 0 5px 0' }}>Error Details:</p>
            <p style={{ color: '#7f1d1d', margin: '0 0 10px 0', fontFamily: 'monospace', fontSize: '0.85rem' }}>
              {this.state.error && this.state.error.toString()}
            </p>
            <details style={{ cursor: 'pointer' }}>
              <summary style={{ color: '#dc2626', fontSize: '0.85rem', fontWeight: 'bold' }}>Tap to view exact line</summary>
              <pre style={{ color: '#991b1b', fontSize: '0.7rem', marginTop: '10px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
          </div>

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

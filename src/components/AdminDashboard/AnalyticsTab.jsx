import React from 'react';

export default function AnalyticsTab() {
  const dashboardUrl = import.meta.env.VITE_POSTHOG_DASHBOARD_URL;

  if (!dashboardUrl || dashboardUrl.includes('paste_your_shared_url_here')) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
        <h2 style={{ color: '#0f172a', marginBottom: '10px' }}>Analytics Dashboard Not Linked</h2>
        <p style={{ color: '#64748b', marginBottom: '20px', maxWidth: '500px', margin: '0 auto 20px' }}>
          To see your live graphs here, you need to paste your PostHog Shared Dashboard URL into your <strong>.env.shop</strong> file.
        </p>
        <div style={{ textAlign: 'left', backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', display: 'inline-block' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#0f172a' }}>How to do it:</h4>
          <ol style={{ margin: 0, paddingLeft: '20px', color: '#475569', lineHeight: '1.6' }}>
            <li>Go to PostHog and click on <strong>Dashboards</strong> on the left menu.</li>
            <li>Click on your main dashboard (or create a new one).</li>
            <li>In the top right corner, click <strong>Share</strong>.</li>
            <li>Turn on "Share dashboard publicly" and copy the link.</li>
            <li>Paste that link in your <code>.env.shop</code> file as <code>VITE_POSTHOG_DASHBOARD_URL=your_link</code></li>
            <li>Restart your local server!</li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '80vh', backgroundColor: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
      <iframe 
        src={`${dashboardUrl}?embedded=true`} 
        width="100%" 
        height="100%" 
        frameBorder="0"
        title="PostHog Analytics Dashboard"
        style={{ display: 'block' }}
      ></iframe>
    </div>
  );
}
